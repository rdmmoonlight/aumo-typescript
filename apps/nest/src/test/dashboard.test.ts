import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chartOfAccounts } from '../db/schema/chart-of-accounts.js';
import { periods } from '../db/schema/periods.js';
import { DashboardModule } from '../modules/dashboard/dashboard.module.js';
import { JournalEntryModule } from '../modules/journal-entries/journal-entry.module.js';
import { isBankAccount } from '../modules/dashboard/dashboard.service.js';
import { createModuleApp } from './helpers/create-module-app.js';
import { createTestDatabase, TEST_DATABASE_URL, type TestDatabase } from './helpers/test-database.js';

const USER = '11111111-1111-1111-1111-111111111111';
const NO_PERIOD_USER = '33333333-3333-3333-3333-333333333333';

describe('isBankAccount (setara Contains Bank/Rekening, tanpa membedakan huruf)', () => {
    it.each([
        ['Bank BCA', true],
        ['rekening BRI', true],
        ['BANK Mandiri', true],
        ['Kas Tunai', false],
        ['Cash on Hand', false],
    ])('%s -> %s', (name, expected) => {
        expect(isBankAccount(name)).toBe(expected);
    });
});

describe.skipIf(!TEST_DATABASE_URL)('Dashboard terhadap perhitungan DashboardController .NET (PostgreSQL nyata)', () => {
    let app: NestExpressApplication;
    let testDb: TestDatabase;

    const get = (path: string, user: string | null = USER) => {
        const http = request(app.getHttpServer()).get(path);
        return user ? http.set('X-User-Id', user) : http;
    };
    const post = (entryDate: string, lines: { accountId: number; debit: number; credit: number }[]) =>
        request(app.getHttpServer())
            .post('/journal-entry/create')
            .set('X-User-Id', USER)
            .send({ entryDate, lines });

    beforeAll(async () => {
        testDb = await createTestDatabase();
        const { db } = testDb;
        const a = (id: number, referenceNumber: number, accountName: string, type: string, role: string) => ({
            id, referenceNumber, accountName, type, role, isActive: true, userId: USER,
        });
        await db.insert(chartOfAccounts).values([
            a(1, 1101, 'Kas', 'Assets', 'CashAndEquivalents'),
            a(2, 1102, 'Bank BCA', 'Assets', 'CashAndEquivalents'),
            a(3, 2101, 'Utang Usaha', 'Liabilities', 'Liability'),
            a(4, 3101, 'Modal', 'Equity', 'Equity'),
            a(5, 4101, 'Pendapatan Jasa', 'OperatingIncome', 'Income'),
            a(6, 5101, 'Beban Listrik', 'OperatingExpenses', 'Expense'),
            a(7, 5102, 'Beban Air', 'OperatingExpenses', 'Expense'),
        ]);
        await db.insert(periods).values({
            periodName: 'Oktober 2026', startDate: new Date('2026-10-01T00:00:00Z'),
            endDate: new Date('2026-10-31T23:59:59Z'), isClosed: false, isSelected: true, userId: USER,
        });

        app = await createModuleApp([DashboardModule, JournalEntryModule], db);

        // E1 (Agustus, di luar periode terpilih), E2-E4 (Oktober)
        for (const [date, lines] of [
            ['2026-08-15T00:00:00', [{ accountId: 1, debit: 1000000, credit: 0 }, { accountId: 4, debit: 0, credit: 1000000 }]],
            ['2026-10-02T00:00:00', [{ accountId: 2, debit: 500000.5, credit: 0 }, { accountId: 5, debit: 0, credit: 500000.5 }]],
            ['2026-10-05T00:00:00', [{ accountId: 6, debit: 150000, credit: 0 }, { accountId: 1, debit: 0, credit: 150000 }]],
            ['2026-10-05T09:00:00', [{ accountId: 1, debit: 200000, credit: 0 }, { accountId: 3, debit: 0, credit: 200000 }]],
        ] as const) {
            const res = await post(date, [...lines]);
            expect(res.status, JSON.stringify(res.body)).toBe(200);
        }
    });

    afterAll(async () => {
        await app?.close();
        await testDb?.dispose();
    });

    it('tab bulanan: saldo kas/bank, pendapatan, beban, kewajiban dan tren harian', async () => {
        const res = await get('/dashboard?period=monthly');
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            success: true,
            hasPeriodSelected: true,
            selectedPeriodName: 'Oktober 2026',
            isPeriodClosed: false,
            totalAssets: 550000.5,
            totalCashOnHand: 50000,
            totalBankBalance: 500000.5,
            totalLiabilities: 200000,
            totalRevenue: 500000.5,
            totalExpenses: 150000,
            netIncome: 350000.5,
            totalEquity: 1000000,
            totalAssetsCumulative: 1550000.5,
            totalCashOnHandCumulative: 1050000,
            totalBankBalanceCumulative: 500000.5,
            totalLiabilitiesCumulative: 200000,
            cashAccounts: [{ accountId: 1, referenceNumber: 1101, accountName: 'Kas', balance: 50000, isBank: false }],
            bankAccounts: [{ accountId: 2, referenceNumber: 1102, accountName: 'Bank BCA', balance: 500000.5, isBank: true }],
            expenseAccountsList: [{ accountId: 6, referenceNumber: 5101, accountName: 'Beban Listrik', balance: 150000 }],
            chartTrend: [
                { label: '02 Oct', revenue: 500000.5, expense: 0, net: 500000.5 },
                { label: '05 Oct', revenue: 0, expense: 150000, net: -150000 },
            ],
            recentEntries: [],
        });
        expect(res.body.chartTrend).toHaveLength(2);
        expect(res.body.expenseAccountsList).toHaveLength(1); // akun beban bersaldo nol tidak ditampilkan
    });

    it('tab tahunan: cakupan satu tahun periode terpilih, tren 12 bulan', async () => {
        const res = await get('/dashboard?period=ANNUAL');
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            selectedPeriodName: 'Annual 2026',
            totalAssets: 1550000.5,
            totalCashOnHand: 1050000,
            totalBankBalance: 500000.5,
            totalLiabilities: 200000,
            totalRevenue: 500000.5,
            totalExpenses: 150000,
            netIncome: 350000.5,
            totalAssetsMonthly: 550000.5,
            totalAssetsAnnual: 1550000.5,
        });
        expect(res.body.chartTrend).toHaveLength(12);
        expect(res.body.chartTrend[0]).toEqual({ label: 'Jan', revenue: 0, expense: 0, net: 0 });
        expect(res.body.chartTrend[9]).toEqual({ label: 'Oct', revenue: 500000.5, expense: 150000, net: 350000.5 });
    });

    it('tanpa parameter period memakai monthly', async () => {
        const res = await get('/dashboard');
        expect(res.status).toBe(200);
        expect(res.body.selectedPeriodName).toBe('Oktober 2026');
    });

    it('period tidak valid: 400 dengan pesan sumber', async () => {
        const res = await get('/dashboard?period=weekly');
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            success: false,
            message: "Period must be 'monthly' or 'annual'.",
            errors: ["Period must be 'monthly' or 'annual'."],
        });
    });

    it('pengguna tanpa periode terpilih: nama "Current Period", semua nol', async () => {
        const res = await get('/dashboard', NO_PERIOD_USER);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            success: true,
            hasPeriodSelected: false,
            selectedPeriodName: 'Current Period',
            isPeriodClosed: false,
            totalAssets: 0,
            totalRevenue: 0,
            cashAccounts: [],
            bankAccounts: [],
            chartTrend: [],
        });
    });

    it('data pengguna lain tidak ikut terhitung', async () => {
        const res = await get('/dashboard?period=annual', NO_PERIOD_USER);
        expect(res.body.totalAssets).toBe(0);
    });

    it('tanpa X-User-Id: 401', async () => {
        const res = await get('/dashboard', null);
        expect(res.status).toBe(401);
    });
});
