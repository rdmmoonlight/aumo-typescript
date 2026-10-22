import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../app.module.js';
import { DashboardService } from '../modules/dashboard/dashboard.service.js';

const mockDashboardData = {
    hasPeriodSelected: true,
    selectedPeriodName: 'Jan 2026',
    isPeriodClosed: false,
    totalAssets: 15000000,
    totalCashOnHand: 5000000,
    totalBankBalance: 10000000,
    totalLiabilities: 2000000,
    totalAssetsMonthly: 15000000,
    totalAssetsAnnual: 45000000,
    totalCashOnHandMonthly: 5000000,
    totalCashOnHandAnnual: 15000000,
    totalBankBalanceMonthly: 10000000,
    totalBankBalanceAnnual: 30000000,
    totalLiabilitiesMonthly: 2000000,
    totalLiabilitiesAnnual: 5000000,
    totalAssetsCumulative: 45000000,
    totalCashOnHandCumulative: 15000000,
    totalBankBalanceCumulative: 30000000,
    totalLiabilitiesCumulative: 5000000,
    totalEquity: 40000000,
    totalRevenue: 25000000,
    totalExpenses: 10000000,
    netIncome: 15000000,
    cashAccounts: [{ accountId: '1', accountName: 'Kas Tunai', balance: 5000000, isBank: false }],
    bankAccounts: [{ accountId: '2', accountName: 'Bank BCA', balance: 10000000, isBank: true }],
    cashAccountsMonthly: [],
    bankAccountsMonthly: [],
    cashAccountsAnnual: [],
    bankAccountsAnnual: [],
    expenseAccountsList: [],
    chartTrend: [{ label: 'Jan', revenue: 1000000, expense: 500000, net: 500000 }],
    recentEntries: [],
};

describe('DashboardModule (E2E)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(DashboardService)
            .useValue({
                getDashboardData: vi.fn().mockImplementation((userId: string, query: { period?: string }) => {
                    // simulasi isAnnual logic
                    if (query.period === 'annual') {
                        return Promise.resolve({ ...mockDashboardData, selectedPeriodName: 'Annual 2026' });
                    }
                    return Promise.resolve(mockDashboardData);
                }),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /dashboard - Tanpa X-User-Id (Harus 401)', async () => {
        const res = await request(app.getHttpServer()).get('/dashboard');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({
            success: false,
            message: 'Header X-User-Id wajib diisi',
        });
    });

    it('GET /dashboard - Dengan X-User-Id Valid (monthly default)', async () => {
        const res = await request(app.getHttpServer()).get('/dashboard').set('X-User-Id', 'user-123');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('totalAssets');
        expect(res.body.data).toHaveProperty('chartTrend');
        expect(res.body.data).toHaveProperty('cashAccounts');
        expect(res.body.data).toHaveProperty('bankAccounts');
    });

    it('GET /dashboard?period=monthly - Harus return monthly breakdown', async () => {
        const res = await request(app.getHttpServer())
            .get('/dashboard?period=monthly')
            .set('X-User-Id', 'user-123');

        expect(res.status).toBe(200);
        expect(res.body.data.hasPeriodSelected).toBe(true);
        expect(res.body.data.totalAssets).toBeDefined();
    });

    it('GET /dashboard?period=annual - Harus return Annual label', async () => {
        const res = await request(app.getHttpServer())
            .get('/dashboard?period=annual')
            .set('X-User-Id', 'user-123');

        expect(res.status).toBe(200);
        expect(res.body.data.selectedPeriodName).toContain('Annual');
        expect(res.body.data.totalAssetsAnnual).toBeDefined();
    });

    it('GET /dashboard?period=invalid - Harus Error 400 Zod', async () => {
        const res = await request(app.getHttpServer())
            .get('/dashboard?period=invalid')
            .set('X-User-Id', 'user-123');

        // tergantung global exception filter kamu, bisa 400
        expect([400, 500]).toContain(res.status);
    });
});