import { beforeEach, describe, expect, it } from 'vitest';
import { DashboardService } from './dashboard.service.js';

describe('DashboardService - pure logic', () => {
    let service: DashboardService;

    beforeEach(() => {
        service = new DashboardService();
    });

    it('isBankAccount harus deteksi Bank & Rekening', () => {
        const isBank = (service as unknown as { isBankAccount: (name: string) => boolean }).isBankAccount.bind(service);
        expect(isBank('Bank BCA')).toBe(true);
        expect(isBank('Rekening BRI')).toBe(true);
        expect(isBank('BANK Mandiri')).toBe(true);
        expect(isBank('Kas Tunai')).toBe(false);
        expect(isBank('Cash on Hand')).toBe(false);
    });

    it('buildCashBreakdown harus hitung Debit - Credit dengan benar', () => {
        const accounts = [
            { id: 'a1', referenceNumber: '1001', accountName: 'Kas Tunai' },
            { id: 'a2', referenceNumber: '1002', accountName: 'Bank BCA' },
        ];
        const lines = [
            { accountId: 'a1', debit: '1000000', credit: '0', entryDate: new Date() },
            { accountId: 'a1', debit: '0', credit: '200000', entryDate: new Date() },
            { accountId: 'a2', debit: '5000000', credit: '0', entryDate: new Date() },
        ];

        const result = (service as unknown as {
            buildCashBreakdown: (
                lines: { accountId: string; debit: string; credit: string; entryDate: Date }[],
                accounts: { id: string; referenceNumber: string; accountName: string }[],
            ) => { balance: number; isBank: boolean }[];
        }).buildCashBreakdown(lines, accounts);
        expect(result[0].balance).toBe(800000); // 1jt - 200rb
        expect(result[0].isBank).toBe(false);
        expect(result[1].balance).toBe(5000000);
        expect(result[1].isBank).toBe(true);
    });

    it('toNumber harus handle string numeric dari Drizzle numeric', () => {
        const toNumber = (service as unknown as { toNumber: (value: string | number) => number }).toNumber.bind(service);
        expect(toNumber('15000.50')).toBe(15000.5);
        expect(toNumber(1000)).toBe(1000);
    });
});