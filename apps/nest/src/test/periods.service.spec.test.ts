import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChartOfAccountsService } from '../modules/chart-of-accounts/chart-of-accounts.service.js';
import { OpeningBalanceService } from '../modules/periods/opening-balance.service.js';
import { PeriodsService } from '../modules/periods/periods.service.js';
import type { DrizzleDb } from '../modules/periods/periods.types.js';

type MockFn = ReturnType<typeof vi.fn>;
type QueryBuilderMock = Record<
  | 'select'
  | 'from'
  | 'where'
  | 'orderBy'
  | 'groupBy'
  | 'update'
  | 'set'
  | 'delete'
  | 'insert'
  | 'values'
  | 'returning'
  | 'onConflictDoUpdate',
  MockFn
>;
type MockDb = QueryBuilderMock & {
  query: { periods: { findFirst: MockFn }; chartOfAccounts: { findFirst: MockFn } };
  transaction: MockFn;
};

// Helper untuk membuat Mock Query Builder Drizzle yang method-chaining
const createQueryBuilderMock = () => {
  const qb: QueryBuilderMock = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
  };
  return qb;
};

describe('PeriodsService', () => {
  let service: PeriodsService;
  let mockDb: MockDb;

  beforeEach(async () => {
    const qbMock = createQueryBuilderMock();

    mockDb = {
      ...qbMock,
      query: {
        periods: { findFirst: vi.fn() },
        chartOfAccounts: { findFirst: vi.fn() },
      },
      // Mock transaksi: mengeksekusi callback dengan mengoper txMock
      transaction: vi.fn(async (cb) => {
        const txMock = {
          ...mockDb,
          rollback: vi.fn(),
        };
        return cb(txMock);
      }),
    };

    // vitest (esbuild) tidak menghasilkan metadata dekorator, jadi dependensi disuntik eksplisit
    service = new PeriodsService(new ChartOfAccountsService(), new OpeningBalanceService());
    // Menginject mock database ke dalam service instance
    service.setDb(mockDb as unknown as DrizzleDb);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPeriods', () => {
    it('should return periods and selectedPeriodId correctly', async () => {
      const userId = 'user-123';
      const mockPeriods = [
        { id: 1, periodName: 'January 2026', isSelected: false },
        { id: 2, periodName: 'February 2026', isSelected: true },
      ];

      mockDb.orderBy.mockResolvedValueOnce(mockPeriods);

      const result = await service.getPeriods(userId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();

      expect(result.success).toBe(true);
      expect(result.selectedPeriodId).toBe(2);
      expect(result.periods).toEqual([
        { id: 1, periodName: 'January 2026', isSelected: false },
        { id: 2, periodName: 'February 2026', isSelected: true },
      ]);
    });
  });

  describe('getOpenPeriodInfo', () => {
    it('should format chart of accounts and check existing permanent accounts', async () => {
      const userId = 'user-123';
      const mockAccounts = [
        {
          id: 1,
          referenceNumber: 101,
          accountName: 'Kas',
          type: 'Assets',
          role: 'CashAndEquivalents',
          isActive: true,
        },
        {
          id: 2,
          referenceNumber: 301,
          accountName: 'Laba Ditahan',
          type: 'Equity',
          role: 'RetainedEarnings',
          isActive: true,
        },
      ];

      mockDb.orderBy.mockResolvedValueOnce(mockAccounts);

      const result = await service.getOpenPeriodInfo(userId);

      expect(result.success).toBe(true);
      expect(result.hasExistingPermanentAccounts).toBe(true);
      expect(result.availableCashAndBankAccounts).toHaveLength(1);
      expect(result.availableRetainedEarningsAccounts).toHaveLength(1);
      expect(result.permanentAccounts).toHaveLength(2);
      expect(result.permanentAccounts[0].displayLabel).toBe('101 - Kas');
    });
  });

  describe('createPeriod', () => {
    const userId = 'user-123';

    it('should return error if period already exists', async () => {
      mockDb.query.periods.findFirst.mockResolvedValueOnce({ id: 1, periodName: 'January 2026' });

      const result = await service.createPeriod(userId, {
        year: 2026,
        month: 1,
        setupMode: 'LoadExisting',
        cashAccountId: 1,
        bankAccountId: 2,
        retainedEarningsAccountId: 3,
      });

      expect(result).toEqual({
        success: false,
        message: 'Period January 2026 already exists.',
      });
    });

    it('should create new accounts and period successfully on CreateNew setupMode', async () => {
      mockDb.query.periods.findFirst.mockResolvedValueOnce(null); // period belum ada
      mockDb.query.chartOfAccounts.findFirst.mockResolvedValueOnce(null); // kode akun belum terpakai

      // Mock return insert akun & periode
      mockDb.returning
        .mockResolvedValueOnce([{ id: 10, referenceNumber: 101 }]) // cashAccount
        .mockResolvedValueOnce([{ id: 11, referenceNumber: 102 }]) // bankAccount
        .mockResolvedValueOnce([{ id: 12, referenceNumber: 301 }]) // retainedAccount
        .mockResolvedValueOnce([{ id: 99, periodName: 'January 2026' }]); // newPeriod

      const result = await service.createPeriod(userId, {
        year: 2026,
        month: 1,
        setupMode: 'CreateNew',
        cashAccountCode: '101',
        cashAccountName: 'Kas Utama',
        bankAccountCode: '102',
        bankAccountName: 'Bank BCA',
        retainedEarningsAccountCode: '301',
        retainedEarningsAccountName: 'Laba Ditahan',
        cashBalance: 1000,
        bankBalance: 2000,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.periodId).toBe(99);
        expect(result.message).toContain('Period January 2026 has been opened successfully.');
      }
      expect(mockDb.insert).toHaveBeenCalledTimes(5); // 3 akun + 1 periode (+ jurnal jika saldo > 0)
    });
  });

  describe('selectPeriod', () => {
    it('should select a period and update DB', async () => {
      const userId = 'user-123';
      const periodId = 5;
      const mockPeriod = { id: periodId, periodName: 'March 2026', isClosed: false };

      mockDb.query.periods.findFirst.mockResolvedValueOnce(mockPeriod);

      const result = await service.selectPeriod(userId, periodId);

      expect(mockDb.query.periods.findFirst).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalledTimes(2); // Unset previous, set new
      expect(mockDb.insert).toHaveBeenCalled(); // Upsert selectedPeriods

      expect(result).toEqual({
        success: true,
        selectedPeriodId: periodId,
        message: 'Now viewing March 2026.',
      });
    });

    it('should return null if period is not found', async () => {
      const userId = 'user-123';
      const periodId = 999;

      mockDb.query.periods.findFirst.mockResolvedValueOnce(null);

      const result = await service.selectPeriod(userId, periodId);

      expect(result).toBeNull();
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });

  describe('clearSelection', () => {
    it('should clear selected period and delete selection record', async () => {
      const userId = 'user-123';

      const result = await service.clearSelection(userId);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.delete).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Period selection cleared.',
      });
    });
  });

  describe('closePeriod', () => {
    it('should close period successfully if no earlier open periods exist', async () => {
      const userId = 'user-123';
      const periodId = 1;

      mockDb.query.periods.findFirst
        .mockResolvedValueOnce({
          id: periodId,
          periodName: 'Jan 2026',
          startDate: '2026-01-01T00:00:00.000Z',
          isClosed: false,
        })
        .mockResolvedValueOnce(null); // Tidak ada periode sebelumnya yang masih terbuka

      const result = await service.closePeriod(userId, periodId);

      expect(mockDb.update).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Period Jan 2026 has been closed. Transactions in this period are now locked.',
      });
    });

    it('should fail to close if an earlier period is still open', async () => {
      const userId = 'user-123';
      const periodId = 2;

      mockDb.query.periods.findFirst
        .mockResolvedValueOnce({
          id: periodId,
          periodName: 'Feb 2026',
          startDate: '2026-02-01T00:00:00.000Z',
          isClosed: false,
        })
        .mockResolvedValueOnce({
          id: 1,
          periodName: 'Jan 2026',
          startDate: '2026-01-01T00:00:00.000Z',
          isClosed: false,
        });

      const result = await service.closePeriod(userId, periodId);

      expect(result).toEqual({
        success: false,
        message:
          'Cannot close Feb 2026: an earlier period is still open. Close earlier periods first.',
      });
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('should fail to close if period is already closed', async () => {
      const userId = 'user-123';
      const periodId = 1;

      mockDb.query.periods.findFirst.mockResolvedValueOnce({
        id: periodId,
        periodName: 'Jan 2026',
        isClosed: true,
      });

      const result = await service.closePeriod(userId, periodId);

      expect(result).toEqual({
        success: false,
        message: 'Period Jan 2026 is already closed.',
      });
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });
});
