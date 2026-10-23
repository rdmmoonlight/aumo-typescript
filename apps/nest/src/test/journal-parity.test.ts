import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chartOfAccounts } from '../db/schema/chart-of-accounts.js';
import { generalJournal } from '../db/schema/general-journal.js';
import { periods } from '../db/schema/periods.js';
import { DashboardModule } from '../modules/dashboard/dashboard.module.js';
import { JournalEntryModule } from '../modules/journal-entries/journal-entry.module.js';
import { OTHER_USER, steps, USER } from './fixtures/journal-parity.js';
import { createModuleApp } from './helpers/create-module-app.js';
import { createTestDatabase, TEST_DATABASE_URL, type TestDatabase } from './helpers/test-database.js';

/** Mengganti "$any" dengan matcher bebas supaya fixture bisa memakai toMatchObject. */
function withMatchers(value: unknown): unknown {
    if (value === '$any') return expect.anything();
    if (Array.isArray(value)) return value.map(withMatchers);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withMatchers(v)]));
    }
    return value;
}

describe.skipIf(!TEST_DATABASE_URL)('Paritas jurnal terhadap perilaku backend .NET (PostgreSQL nyata)', () => {
    let app: NestExpressApplication;
    let testDb: TestDatabase;
    let db: NodePgDatabase;

    beforeAll(async () => {
        testDb = await createTestDatabase();
        db = testDb.db;

        const account = (id: number, referenceNumber: number, accountName: string, type: string, role: string, userId = USER, isActive = true) => ({
            id, referenceNumber, accountName, type, role, isActive, userId,
        });
        await db.insert(chartOfAccounts).values([
            account(1, 1101, 'Kas', 'Assets', 'CashAndEquivalents'),
            account(2, 5101, 'Beban Listrik', 'OperatingExpenses', 'Expense'),
            account(3, 5102, 'Akun Nonaktif', 'OperatingExpenses', 'Expense', USER, false),
            account(11, 1101, 'Kas', 'Assets', 'CashAndEquivalents', OTHER_USER),
            account(12, 5101, 'Beban Listrik', 'OperatingExpenses', 'Expense', OTHER_USER),
        ]);
        await db.insert(periods).values([
            { periodName: 'September 2026', startDate: new Date('2026-09-01T00:00:00Z'), endDate: new Date('2026-09-30T23:59:59Z'), isClosed: true, isSelected: false, userId: USER },
            { periodName: 'Oktober 2026', startDate: new Date('2026-10-01T00:00:00Z'), endDate: new Date('2026-10-31T23:59:59Z'), isClosed: false, isSelected: true, userId: USER },
        ]);
        // Entri lama di periode yang sudah ditutup (id kelompok 100, di luar urutan sequence).
        await db.insert(generalJournal).values(
            [{ accountId: 1, debit: '5000.00', credit: '0.00', lineOrder: 0 }, { accountId: 2, debit: '0.00', credit: '5000.00', lineOrder: 1 }].map((l) => ({
                ...l, journalEntryId: 100, journalType: 'General', entryDate: new Date('2026-09-10T00:00:00Z'),
                transactionNumber: 'GJ26090099', userId: USER, status: 'Posted', createdAt: new Date('2026-09-10T00:00:00Z'),
            })),
        );

        app = await createModuleApp([JournalEntryModule, DashboardModule], db);
    });

    afterAll(async () => {
        await app?.close();
        await testDb?.dispose();
    });

    // Langkah berurutan: setiap langkah bergantung pada keadaan database dari langkah sebelumnya.
    for (const step of steps) {
        it(step.name, async () => {
            const http = request(app.getHttpServer())[step.method](step.path);
            const user = step.user === undefined ? USER : step.user;
            if (user) http.set('X-User-Id', user);
            const res = step.body === undefined ? await http : await http.send(step.body as object);

            expect(res.status, JSON.stringify(res.body)).toBe(step.status);
            expect(res.body).toMatchObject(withMatchers(step.expect) as object);
            if (Array.isArray(step.expect)) expect(res.body).toHaveLength(step.expect.length);
        });
    }
});
