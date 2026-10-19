import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, inArray, lt, lte, sql } from 'drizzle-orm';
import * as accountSchema from '../../db/schema/chart-of-accounts.js';
import * as generalJournalSchema from '../../db/schema/general-journal.js';
import * as periodSchema from '../../db/schema/periods.js';
import { PERMANENT_TYPES, TEMPORARY_TYPES } from './periods.constants.js';
import type { AccountSelect, GeneralJournalInsert, Tx } from './periods.types.js';

const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class OpeningBalanceService {
  async addOpeningBalanceJournal(
    tx: Tx,
    userId: string,
    startDate: Date,
    retainedAccount: AccountSelect
  ) {
    const previous = await tx.query.periods.findFirst({
      where: and(
        eq(periodSchema.periods.userId, userId),
        lt(periodSchema.periods.startDate, startDate.toISOString())
      ),
      orderBy: desc(periodSchema.periods.startDate),
    });
    if (!previous) return { accountCount: 0, error: null as string | null };

    const prevStart = new Date(previous.startDate);
    prevStart.setUTCHours(0, 0, 0, 0);
    const prevEnd = new Date(previous.endDate);
    prevEnd.setUTCHours(23, 59, 59, 999);

    if (!(PERMANENT_TYPES as readonly string[]).includes(retainedAccount.type)) {
      return {
        accountCount: 0,
        error: 'The selected Retained Earnings account must be an Equity account.',
      };
    }

    const accounts = await tx
      .select()
      .from(accountSchema.chartOfAccounts)
      .where(
        and(
          eq(accountSchema.chartOfAccounts.userId, userId),
          eq(accountSchema.chartOfAccounts.isActive, true)
        )
      );
    const allAccounts = accounts.some((a) => a.id === retainedAccount.id)
      ? accounts
      : [...accounts, retainedAccount];

    const totalsRows = await tx
      .select({
        accountId: generalJournalSchema.generalJournal.accountId,
        debit: sql<number>`sum(${generalJournalSchema.generalJournal.debit}::decimal)`.mapWith(
          Number
        ),
        credit: sql<number>`sum(${generalJournalSchema.generalJournal.credit}::decimal)`.mapWith(
          Number
        ),
      })
      .from(generalJournalSchema.generalJournal)
      .where(
        and(
          eq(generalJournalSchema.generalJournal.userId, userId),
          inArray(generalJournalSchema.generalJournal.journalType, ['General', 'Adjusting']),
          gte(generalJournalSchema.generalJournal.entryDate, prevStart.toISOString()),
          lte(generalJournalSchema.generalJournal.entryDate, prevEnd.toISOString())
        )
      )
      .groupBy(generalJournalSchema.generalJournal.accountId);

    const totals = new Map<number, { debit: number; credit: number }>(
      totalsRows
        .filter((r): r is typeof r & { accountId: number } => r.accountId !== null)
        .map((r) => [r.accountId, { debit: r.debit ?? 0, credit: r.credit ?? 0 }])
    );

    const signed = (accountId: number) => {
      const t = totals.get(accountId);
      return t ? t.debit - t.credit : 0;
    };

    const netIncome = allAccounts
      .filter((a) => (TEMPORARY_TYPES as readonly string[]).includes(a.type))
      .reduce((sum: number, a) => sum + -signed(a.id), 0);

    const balances: { account: AccountSelect; signed: number }[] = [];
    for (const acc of allAccounts
      .filter((a) => (PERMANENT_TYPES as readonly string[]).includes(a.type))
      .sort((a, b) => a.referenceNumber - b.referenceNumber)) {
      let bal = signed(acc.id);
      if (acc.id === retainedAccount.id) bal -= netIncome;
      bal = round2(bal);
      if (bal !== 0) balances.push({ account: acc, signed: bal });
    }

    if (balances.length === 0) return { accountCount: 0, error: null };

    const totalDebit = balances.filter((b) => b.signed > 0).reduce((s, b) => s + b.signed, 0);
    const totalCredit = balances
      .filter((b) => b.signed < 0)
      .reduce((s, b) => s + Math.abs(b.signed), 0);

    if (round2(totalDebit - totalCredit) !== 0) {
      return {
        accountCount: 0,
        error: `Saldo Awal is not balanced (debit ${totalDebit.toFixed(2)} vs credit ${totalCredit.toFixed(2)}). Check the journals of ${previous.periodName}.`,
      };
    }

    const trxNumber = `GJ-${Date.now()}`;
    const entryId = Date.now();
    const nowString = new Date().toISOString();
    const entryDateString = startDate.toISOString();

    const journalRows: GeneralJournalInsert[] = balances.map((b) => ({
      entryId,
      userId,
      transactionNumber: trxNumber,
      journalType: 'General',
      entryDate: entryDateString,
      description: 'Saldo Awal',
      accountId: b.account.id,
      accountNumber: b.account.referenceNumber,
      debit: b.signed > 0 ? String(b.signed) : '0',
      credit: b.signed < 0 ? String(Math.abs(b.signed)) : '0',
      status: 'Posted',
      createdAt: nowString,
    }));

    await tx.insert(generalJournalSchema.generalJournal).values(journalRows);

    return { accountCount: balances.length, error: null };
  }
}
