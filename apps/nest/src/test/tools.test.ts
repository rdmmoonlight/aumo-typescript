import type { NestExpressApplication } from '@nestjs/platform-express';
import { and, asc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { configureApp } from '../app.setup.js';
import { chartOfAccounts } from '../db/schema/chart-of-accounts.js';
import { generalJournal } from '../db/schema/general-journal.js';
import { periods } from '../db/schema/periods.js';
import { transactionCounters } from '../db/schema/transaction-counters.js';
import { ToolsModule } from '../modules/tools/tools.module.js';
import { createModuleApp } from './helpers/create-module-app.js';
import { createTestDatabase, TEST_DATABASE_URL, type TestDatabase } from './helpers/test-database.js';

const USER = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';

const line = (refNumber: number, accountName: string, debit: number | null, credit: number | null, description = 'uji') => ({
    refNumber, accountName, description, debit, credit,
});
const tx = (date: string, journalType: string, lines: unknown[], transactionNumber = 'X') => ({
    transactionNumber, date, journalType, lines,
});
const pair = (amount = 100000) => [line(1101, 'Kas', amount, null), line(4101, 'Pendapatan', null, amount)];

describe.skipIf(!TEST_DATABASE_URL)('ToolsModule terhadap perilaku ToolsController .NET (PostgreSQL nyata)', () => {
    let app: NestExpressApplication;
    let testDb: TestDatabase;
    let db: NodePgDatabase;

    const call = (method: 'get' | 'post', path: string, body?: unknown, user: string | null = USER) => {
        const http = request(app.getHttpServer())[method](path);
        if (user) http.set('X-User-Id', user);
        return body === undefined ? http : http.send(body as object);
    };
    const numbers = async (userId = USER) =>
        (await db.selectDistinct({ n: generalJournal.transactionNumber }).from(generalJournal)
            .where(eq(generalJournal.userId, userId)).orderBy(asc(generalJournal.transactionNumber))).map((r) => r.n);
    const counter = async (key: string, userId = USER) =>
        (await db.select().from(transactionCounters)
            .where(and(eq(transactionCounters.userId, userId), eq(transactionCounters.counterKey, key))))[0]?.lastSequence;

    beforeAll(async () => {
        testDb = await createTestDatabase();
        db = testDb.db;
        const a = (id: number, referenceNumber: number, accountName: string, type: string, role: string, userId = USER, isActive = true) => ({
            id, referenceNumber, accountName, type, role, isActive, userId,
        });
        await db.insert(chartOfAccounts).values([
            a(1, 1101, 'Kas', 'Assets', 'CashAndEquivalents'),
            a(2, 4101, 'Pendapatan', 'OperatingIncome', 'Income'),
            a(3, 5101, 'Beban Listrik', 'OperatingExpenses', 'Expense'),
            a(4, 5102, 'Akun Nonaktif', 'OperatingExpenses', 'Expense', USER, false),
            a(11, 1101, 'Kas Besar', 'Assets', 'CashAndEquivalents', OTHER),
        ]);
        // configureApp memasang parser JSON khusus /tools (10 MB); parser global hanya 1 MB.
        app = await createModuleApp([ToolsModule], db, { configure: configureApp });
    });
    afterAll(async () => {
        await app?.close();
        await testDb?.dispose();
    });

    it('template: dua sheet GJ dan AJ, header tebal, berkas xlsx', async () => {
        const res = await call('get', '/tools/download-journal-template')
            .buffer(true)
            .parse((r, cb) => {
                const chunks: Buffer[] = [];
                r.on('data', (c: Buffer) => chunks.push(c));
                r.on('end', () => cb(null, Buffer.concat(chunks)));
            });
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        expect(res.headers['content-disposition']).toBe('attachment; filename="JournalImportTemplate.xlsx"');

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(res.body as Buffer);
        expect(workbook.worksheets.map((w) => w.name)).toEqual(['GJ', 'AJ']);
        for (const sheet of workbook.worksheets) {
            expect((sheet.getRow(1).values as unknown[]).slice(1)).toEqual(['Date', 'Account Name', 'Description', 'Ref', 'Debit', 'Credit']);
            expect(sheet.getRow(1).font?.bold).toBe(true);
        }
    });

    it('tanpa X-User-Id: 401', async () => {
        expect((await call('get', '/tools/download-journal-template', undefined, null)).status).toBe(401);
        expect((await call('post', '/tools/preview-journal-import', { targetYear: 2026, targetMonth: 5, transactions: [tx('2026-05-10', 'General', pair())] }, null)).status).toBe(401);
    });

    it('preview: nomor 5 digit, tanggal dipaksa ke bulan target, pemetaan, ringkasan', async () => {
        const res = await call('post', '/tools/preview-journal-import', {
            targetYear: 2026, targetMonth: 5,
            transactions: [
                tx('2026-05-10', 'General', [line(1101, 'kas', 100000, null), line(4101, ' PENDAPATAN ', null, 100000)]),
                tx('2026-03-31', 'General', [line(1101, 'Kas', 50000, null), line(9999, 'Hantu', null, 50000)]),
                tx('2026-05-15', 'adjusting', pair(1000)),
            ],
        });
        expect(res.status).toBe(200);
        expect(res.body.transactions.map((t: { transactionNumber: string; date: string; journalType: string }) => [t.transactionNumber, t.date, t.journalType])).toEqual([
            ['GJ260500001', '2026-05-10', 'General'],
            ['GJ260500002', '2026-05-31', 'General'],
            ['AJ260500001', '2026-05-15', 'adjusting'],
        ]);
        expect(res.body.transactions[0].lines[1]).toEqual({ refNumber: 4101, accountName: 'PENDAPATAN', description: 'uji', debit: null, credit: 100000 });
        expect(res.body.accountMappings).toEqual([
            { excelRef: 1101, excelAccountName: 'kas', mappedRef: 1101, mappedAccountName: 'Kas', status: 'EXACT_MATCH', reason: 'Nomor Ref dan Nama Akun cocok 100% presisi dengan Master COA.' },
            { excelRef: 4101, excelAccountName: 'PENDAPATAN', mappedRef: 4101, mappedAccountName: 'Pendapatan', status: 'EXACT_MATCH', reason: 'Nomor Ref dan Nama Akun cocok 100% presisi dengan Master COA.' },
            { excelRef: 1101, excelAccountName: 'Kas', mappedRef: 1101, mappedAccountName: 'Kas', status: 'EXACT_MATCH', reason: 'Nomor Ref dan Nama Akun cocok 100% presisi dengan Master COA.' },
            { excelRef: 9999, excelAccountName: 'Hantu', mappedRef: 0, mappedAccountName: '', status: 'UNMAPPED', reason: 'Silakan pilih akun pelimpahan manual dari dropdown.' },
            { excelRef: 4101, excelAccountName: 'Pendapatan', mappedRef: 4101, mappedAccountName: 'Pendapatan', status: 'EXACT_MATCH', reason: 'Nomor Ref dan Nama Akun cocok 100% presisi dengan Master COA.' },
        ].filter((m, i, all) => all.findIndex((x) => x.excelRef === m.excelRef && x.excelAccountName === m.excelAccountName) === i));
        expect(res.body.summary).toEqual({ totalUniqueAccounts: 5, exactMatchCount: 4, reallocatedCount: 0, unmappedCount: 1, isPerfectMatch: false });
    });

    it('preview tidak mengubah database', async () => {
        expect(await numbers()).toEqual([]);
        expect(await db.select().from(transactionCounters)).toHaveLength(0);
        expect(await db.select().from(periods)).toHaveLength(0);
    });

    it('preview: hari dijepit ke akhir bulan target (Februari)', async () => {
        const res = await call('post', '/tools/preview-journal-import', { targetYear: 2026, targetMonth: 2, transactions: [tx('2026-01-31', 'General', pair())] });
        expect(res.body.transactions[0]).toMatchObject({ transactionNumber: 'GJ260200001', date: '2026-02-28' });
    });

    it('preview: akun hanya dicocokkan dengan COA aktif milik pengguna sendiri', async () => {
        const res = await call('post', '/tools/preview-journal-import', {
            targetYear: 2026, targetMonth: 5,
            transactions: [tx('2026-05-10', 'General', [line(5102, 'Akun Nonaktif', 10, null), line(1101, 'Kas Besar', null, 10)])],
        });
        expect(res.body.summary).toMatchObject({ exactMatchCount: 0, unmappedCount: 2, isPerfectMatch: false });
        const other = await call('post', '/tools/preview-journal-import', {
            targetYear: 2026, targetMonth: 5,
            transactions: [tx('2026-05-10', 'General', [line(1101, 'Kas Besar', 10, null), line(4101, 'Pendapatan', null, 10)])],
        }, OTHER);
        expect(other.body.summary).toMatchObject({ exactMatchCount: 1, unmappedCount: 1 });
    });

    it('import: membuat periode, jurnal, dan counter; pemetaan manual dipakai', async () => {
        const res = await call('post', '/tools/import-journal-entries', {
            targetYear: 2026, targetMonth: 5,
            transactions: [
                tx('2026-05-10', 'General', pair(100000)),
                tx('2026-03-31', 'General', [line(1101, 'Kas', 50000, null), line(9999, 'Hantu', null, 50000)]),
                tx('2026-05-15', 'adjusting', pair(1000)),
            ],
            customMappings: [{ excelRef: 9999, excelAccountName: 'hantu', mappedRef: 4101, mappedAccountName: 'Pendapatan', status: 'REALLOCATED_REF', reason: '' }],
        });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Journal data successfully imported.', importedEntriesCount: 3 });

        expect(await numbers()).toEqual(['AJ260500001', 'GJ260500001', 'GJ260500002']);
        expect(await counter('GJ2605')).toBe(2);
        expect(await counter('AJ2605')).toBe(1);

        const [period] = await db.select().from(periods).where(eq(periods.userId, USER));
        expect(period).toMatchObject({ periodName: 'Mei 2026', isClosed: false, isSelected: false });
        expect(period.startDate.toISOString()).toBe('2026-05-01T00:00:00.000Z');
        expect(period.endDate.toISOString()).toBe('2026-05-31T00:00:00.000Z');

        const rows = await db.select().from(generalJournal).where(eq(generalJournal.transactionNumber, 'GJ260500002'));
        expect(rows).toHaveLength(2);
        expect(rows.map((r) => r.accountId).sort()).toEqual([1, 2]); // 9999 dipetakan ke 4101 (id 2)
        for (const r of rows) {
            expect(r.entryDate.toISOString()).toBe('2026-05-31T00:00:00.000Z');
            expect(r.createdAt.toISOString()).toBe(r.entryDate.toISOString());
            expect(r.updatedAt).toBeNull();
            expect(r).toMatchObject({ status: 'Posted', journalType: 'General', userId: USER });
        }
        expect([...rows].sort((x, y) => x.lineOrder - y.lineOrder).map((r) => r.lineOrder)).toEqual([0, 1]);
        const adjusting = await db.select().from(generalJournal).where(eq(generalJournal.transactionNumber, 'AJ260500001'));
        expect(adjusting[0].journalType).toBe('adjusting'); // disimpan apa adanya seperti sumber
        expect(new Set((await db.select().from(generalJournal)).map((r) => r.journalEntryId)).size).toBe(3);
    });

    it('preview dan import berikutnya melanjutkan urutan; periode tidak digandakan', async () => {
        const body = { targetYear: 2026, targetMonth: 5, transactions: [tx('2026-05-20', 'General', pair())] };
        const preview = await call('post', '/tools/preview-journal-import', body);
        expect(preview.body.transactions[0].transactionNumber).toBe('GJ260500003');
        const res = await call('post', '/tools/import-journal-entries', body);
        expect(res.body.importedEntriesCount).toBe(1);
        expect(await counter('GJ2605')).toBe(3);
        expect(await db.select().from(periods).where(eq(periods.userId, USER))).toHaveLength(1);
    });

    it('baris dengan akun tidak ditemukan dilewati; entri tanpa baris tersisa tidak ditulis', async () => {
        const res = await call('post', '/tools/import-journal-entries', {
            targetYear: 2026, targetMonth: 5,
            transactions: [
                tx('2026-05-21', 'General', [line(1101, 'Kas', 70, null), line(9999, 'Hantu', null, 70)]),
                tx('2026-05-22', 'General', [line(8888, 'A', 5, null), line(9999, 'B', null, 5)]),
            ],
        });
        expect(res.body.importedEntriesCount).toBe(1);
        const written = await db.select().from(generalJournal).where(eq(generalJournal.transactionNumber, 'GJ260500004'));
        expect(written).toHaveLength(1); // baris 9999 dilewati (perilaku sumber)
        expect(await counter('GJ2605')).toBe(5); // nomor tetap terpakai walau entri tidak ditulis
    });

    it('nomor yang sudah ada dilewati meski counter belum mencapainya', async () => {
        await db.insert(generalJournal).values({
            accountId: 1, debit: '1.00', credit: '0.00', lineOrder: 0, journalEntryId: 900, journalType: 'General',
            entryDate: new Date('2026-06-01T00:00:00Z'), transactionNumber: 'GJ260600001', userId: USER, status: 'Posted',
            createdAt: new Date('2026-06-01T00:00:00Z'),
        });
        const res = await call('post', '/tools/import-journal-entries', { targetYear: 2026, targetMonth: 6, transactions: [tx('2026-06-10', 'General', pair())] });
        expect(res.body.importedEntriesCount).toBe(1);
        expect(await numbers()).toContain('GJ260600002');
        expect(await counter('GJ2606')).toBe(2);
    });

    it('kegagalan di tengah impor: tidak ada yang tersimpan (periode, counter, jurnal)', async () => {
        const res = await call('post', '/tools/import-journal-entries', {
            targetYear: 2026, targetMonth: 7,
            transactions: [tx('2026-07-10', 'General', pair(1)), tx('2026-07-11', 'General', pair(1e16))],
        });
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ success: false, message: 'Terjadi kesalahan pada server' });
        const names = (await db.select().from(periods).where(eq(periods.userId, USER))).map((p) => p.periodName);
        expect(names).not.toContain('Juli 2026'); // periode yang dibuat di awal transaksi ikut dibatalkan
        expect(await counter('GJ2607')).toBeUndefined();
        expect((await numbers()).filter((n) => n.startsWith('GJ2607'))).toEqual([]);
    });

    it('validasi: 400 dengan errors[] seperti ToErrorResponse sumber', async () => {
        const res = await call('post', '/tools/import-journal-entries', {
            targetYear: 2026, targetMonth: 13,
            transactions: [tx('x', 'GJ', [line(1, 'a', 1, null)], 'TX-9')],
        });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            success: false,
            message: 'Invalid period parameters provided.',
            errors: [
                'Invalid period parameters provided.',
                "Transaction 'TX-9' has an invalid date.",
                "Transaction 'TX-9' has an invalid journal type (use 'General' or 'Adjusting').",
                "Transaction 'TX-9' must have at least two lines.",
            ],
        });
        const preview = await call('post', '/tools/preview-journal-import', { targetYear: 2026, targetMonth: 5, transactions: [] });
        expect(preview.status).toBe(400);
        expect(preview.body.message).toBe('No transaction data provided.');
        expect((await call('post', '/tools/preview-journal-import', { targetYear: 'abc' })).status).toBe(400);
    });

    it('identitas bukan GUID: 401 setelah validasi lolos', async () => {
        const res = await call('post', '/tools/preview-journal-import', { targetYear: 2026, targetMonth: 5, transactions: [tx('2026-05-10', 'General', pair())] }, 'bukan-guid');
        expect(res.status).toBe(401);
    });

    it('body besar (di atas 1 MB, di bawah 10 MB) diterima', async () => {
        const many = Array.from({ length: 2500 }, (_, i) => tx('2026-05-10', 'General', pair(1), `T${i}`.padEnd(200, 'x')));
        const res = await call('post', '/tools/preview-journal-import', { targetYear: 2026, targetMonth: 5, transactions: many });
        expect(res.status).toBe(200);
        expect(res.body.transactions).toHaveLength(2500);
    });
});
