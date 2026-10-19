import { Injectable } from '@nestjs/common';
import { and, desc, eq, lt, ne } from 'drizzle-orm';
import * as accountSchema from '../../db/schema/chart-of-accounts.js';
import * as generalJournalSchema from '../../db/schema/general-journal.js';
import * as periodSchema from '../../db/schema/periods.js';
import { db as drizzleDb } from '../../lib/db.js';
import { ChartOfAccountsService } from '../chart-of-accounts/chart-of-accounts.service.js';
import { OpeningBalanceService } from './opening-balance.service.js';
import type {
  BaseServiceResult,
  CreatePeriodRequest,
  CreatePeriodResult,
  DrizzleDb,
  GeneralJournalInsert,
  OpenPeriodInfoResponse,
  SelectPeriodResult,
  Tx,
} from './periods.types.js';

const fail = (message: string): CreatePeriodResult => ({ success: false, message });

/** Kegagalan bisnis saat membuka periode: melempar agar transaksi di-rollback, pesannya tetap utuh. */
class PeriodSetupError extends Error {}

@Injectable()
export class PeriodsService {
  private db: DrizzleDb;

  constructor(
    private readonly coaService: ChartOfAccountsService,
    private readonly openingBalanceService: OpeningBalanceService
  ) {
    this.db = drizzleDb as unknown as DrizzleDb;
  }

  setDb(db: DrizzleDb) {
    this.db = db;
  }

  async getPeriods(userId: string) {
    const periodsData = await this.db
      .select({
        id: periodSchema.periods.id,
        periodName: periodSchema.periods.periodName,
        startDate: periodSchema.periods.startDate,
        endDate: periodSchema.periods.endDate,
        isClosed: periodSchema.periods.isClosed,
        isSelected: periodSchema.periods.isSelected,
      })
      .from(periodSchema.periods)
      .where(eq(periodSchema.periods.userId, userId))
      .orderBy(desc(periodSchema.periods.startDate));

    const selectedPeriodId = periodsData.find((p) => p.isSelected)?.id ?? null;

    const periods = periodsData.map((p) => ({
      ...p,
      isSelected: selectedPeriodId ? p.id === selectedPeriodId : p.isSelected,
    }));

    return { success: true, selectedPeriodId, periods };
  }

  async getOpenPeriodInfo(userId: string): Promise<OpenPeriodInfoResponse> {
    return this.coaService.getOpenPeriodInfo(this.db, userId);
  }

  async createPeriod(userId: string, request: CreatePeriodRequest): Promise<CreatePeriodResult> {
    const startDate = new Date(Date.UTC(request.year, request.month - 1, 1));
    const endDate = new Date(Date.UTC(request.year, request.month, 0));
    const periodName = startDate.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });

    try {
      return await this.db.transaction(async (tx: Tx) => {
        const exists = await tx.query.periods.findFirst({
          where: and(
            eq(periodSchema.periods.userId, userId),
            eq(periodSchema.periods.startDate, startDate.toISOString())
          ),
        });
        if (exists) return fail(`Period ${periodName} already exists.`);

        if (request.setupMode === 'LoadExisting') {
          const [cashAcc, bankAcc, retainedAcc] = await Promise.all([
            tx.query.chartOfAccounts.findFirst({
              where: and(
                eq(accountSchema.chartOfAccounts.id, request.cashAccountId!),
                eq(accountSchema.chartOfAccounts.userId, userId)
              ),
            }),
            tx.query.chartOfAccounts.findFirst({
              where: and(
                eq(accountSchema.chartOfAccounts.id, request.bankAccountId!),
                eq(accountSchema.chartOfAccounts.userId, userId)
              ),
            }),
            tx.query.chartOfAccounts.findFirst({
              where: and(
                eq(accountSchema.chartOfAccounts.id, request.retainedEarningsAccountId!),
                eq(accountSchema.chartOfAccounts.userId, userId)
              ),
            }),
          ]);

          if (!cashAcc || !bankAcc || !retainedAcc) {
            return fail('One or more selected accounts could not be found.');
          }
          if (retainedAcc.role !== 'RetainedEarnings') {
            return fail(
              'The selected Retained Earnings account is not a Retained Earnings account.'
            );
          }

          const [newPeriod] = await tx
            .insert(periodSchema.periods)
            .values({
              userId,
              periodName,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              isClosed: false,
              isSelected: false,
            })
            .returning();

          const opening = await this.openingBalanceService.addOpeningBalanceJournal(
            tx,
            userId,
            startDate,
            retainedAcc
          );
          if (opening.error !== null) {
            throw new PeriodSetupError(opening.error);
          }

          const carryInfo =
            opening.accountCount > 0
              ? ` Saldo Awal journal created for ${opening.accountCount} permanent accounts.`
              : ' No previous period balances to carry forward.';

          return {
            success: true,
            message: `Period ${newPeriod.periodName} has been opened successfully.${carryInfo}`,
            periodId: newPeriod.id,
          };
        } else {
          const { cashAccount, bankAccount, retainedAccount } =
            await this.coaService.validateAndCreateInitialAccounts(tx, userId, {
              cashAccountCode: request.cashAccountCode!,
              cashAccountName: request.cashAccountName!,
              bankAccountCode: request.bankAccountCode!,
              bankAccountName: request.bankAccountName!,
              retainedEarningsAccountCode: request.retainedEarningsAccountCode!,
              retainedEarningsAccountName: request.retainedEarningsAccountName!,
            });

          const [newPeriod] = await tx
            .insert(periodSchema.periods)
            .values({
              userId,
              periodName,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              isClosed: false,
              isSelected: false,
            })
            .returning();

          const cashBalance = request.cashBalance ?? 0;
          const bankBalance = request.bankBalance ?? 0;
          const totalOpening = cashBalance + bankBalance;

          if (totalOpening !== 0) {
            const trxNumber = `GJ-${Date.now()}`;
            const entryId = Date.now();
            const nowString = new Date().toISOString();
            const entryDateString = startDate.toISOString();
            const lines: GeneralJournalInsert[] = [];

            if (cashBalance !== 0) {
              lines.push({
                entryId,
                userId,
                transactionNumber: trxNumber,
                journalType: 'General',
                entryDate: entryDateString,
                description: 'Saldo Awal',
                accountId: cashAccount.id,
                accountNumber: cashAccount.referenceNumber,
                debit: String(cashBalance),
                credit: '0',
                status: 'Posted',
                createdAt: nowString,
              });
            }

            if (bankBalance !== 0) {
              lines.push({
                entryId,
                userId,
                transactionNumber: trxNumber,
                journalType: 'General',
                entryDate: entryDateString,
                description: 'Saldo Awal',
                accountId: bankAccount.id,
                accountNumber: bankAccount.referenceNumber,
                debit: String(bankBalance),
                credit: '0',
                status: 'Posted',
                createdAt: nowString,
              });
            }

            lines.push({
              entryId,
              userId,
              transactionNumber: trxNumber,
              journalType: 'General',
              entryDate: entryDateString,
              description: 'Saldo Awal',
              accountId: retainedAccount.id,
              accountNumber: retainedAccount.referenceNumber,
              debit: '0',
              credit: String(totalOpening),
              status: 'Posted',
              createdAt: nowString,
            });

            await tx.insert(generalJournalSchema.generalJournal).values(lines);
          }

          return {
            success: true,
            message: `Period ${newPeriod.periodName} has been opened successfully.`,
            periodId: newPeriod.id,
          };
        }
      });
    } catch (e: unknown) {
      if (e instanceof PeriodSetupError) return fail(e.message);
      const err = e as { cause?: { message?: string }; message?: string };
      return {
        success: false,
        isServerError: true,
        message: `Failed to open period: ${err?.cause?.message ?? err?.message ?? String(e)}`,
      };
    }
  }

  async selectPeriod(userId: string, periodId: number): Promise<SelectPeriodResult | null> {
    const entity = await this.db.query.periods.findFirst({
      where: and(eq(periodSchema.periods.id, periodId), eq(periodSchema.periods.userId, userId)),
    });
    if (!entity) return null;

    await this.db
      .update(periodSchema.periods)
      .set({ isSelected: false })
      .where(
        and(eq(periodSchema.periods.userId, userId), eq(periodSchema.periods.isSelected, true))
      );
    await this.db
      .update(periodSchema.periods)
      .set({ isSelected: true })
      .where(and(eq(periodSchema.periods.id, periodId), eq(periodSchema.periods.userId, userId)));

    await this.db
      .insert(periodSchema.selectedPeriods)
      .values({ userId, periodId: entity.id, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: periodSchema.selectedPeriods.userId,
        set: { periodId: entity.id, updatedAt: new Date() },
      });

    return {
      success: true,
      selectedPeriodId: entity.id,
      message: `Now viewing ${entity.periodName}${entity.isClosed ? ' (Closed).' : '.'}`,
    };
  }

  async clearSelection(userId: string): Promise<BaseServiceResult> {
    await this.db
      .update(periodSchema.periods)
      .set({ isSelected: false })
      .where(
        and(eq(periodSchema.periods.userId, userId), eq(periodSchema.periods.isSelected, true))
      );
    await this.db
      .delete(periodSchema.selectedPeriods)
      .where(eq(periodSchema.selectedPeriods.userId, userId));
    return { success: true, message: 'Period selection cleared.' };
  }

  async closePeriod(userId: string, periodId: number): Promise<BaseServiceResult> {
    const entity = await this.db.query.periods.findFirst({
      where: and(eq(periodSchema.periods.id, periodId), eq(periodSchema.periods.userId, userId)),
    });
    if (!entity) return { success: false, message: 'Accounting period not found.' };
    if (entity.isClosed)
      return { success: false, message: `Period ${entity.periodName} is already closed.` };

    const hasEarlierOpen = await this.db.query.periods.findFirst({
      where: and(
        eq(periodSchema.periods.userId, userId),
        lt(periodSchema.periods.startDate, entity.startDate),
        eq(periodSchema.periods.isClosed, false),
        ne(periodSchema.periods.id, entity.id)
      ),
    });
    if (hasEarlierOpen)
      return {
        success: false,
        message: `Cannot close ${entity.periodName}: an earlier period is still open. Close earlier periods first.`,
      };

    await this.db
      .update(periodSchema.periods)
      .set({ isClosed: true })
      .where(eq(periodSchema.periods.id, entity.id));
    return {
      success: true,
      message: `Period ${entity.periodName} has been closed. Transactions in this period are now locked.`,
    };
  }
}
