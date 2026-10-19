import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import * as accountSchema from '../../db/schema/chart-of-accounts.js';
import { PERMANENT_TYPES } from './periods.constants.js';
import type { AccountSimpleDto, DrizzleDb, OpenPeriodInfoResponse, Tx } from './periods.types.js';

@Injectable()
export class ChartOfAccountsService {
  async getOpenPeriodInfo(db: DrizzleDb, userId: string): Promise<OpenPeriodInfoResponse> {
    const accounts = await db
      .select()
      .from(accountSchema.chartOfAccounts)
      .where(
        and(
          eq(accountSchema.chartOfAccounts.userId, userId),
          eq(accountSchema.chartOfAccounts.isActive, true)
        )
      )
      .orderBy(asc(accountSchema.chartOfAccounts.referenceNumber));

    const toDto = (a: (typeof accounts)[number]): AccountSimpleDto => ({
      id: a.id,
      referenceNumber: a.referenceNumber,
      accountName: a.accountName,
      type: a.type,
      displayLabel: `${a.referenceNumber} - ${a.accountName}`,
    });

    const permanentAccounts = accounts
      .filter((a) => (PERMANENT_TYPES as readonly string[]).includes(a.type))
      .map(toDto);
    const availableCashAndBank = accounts
      .filter((a) => a.role === 'CashAndEquivalents')
      .map(toDto);
    const availableRetainedEarnings = accounts
      .filter((a) => a.role === 'RetainedEarnings')
      .map(toDto);

    return {
      success: true,
      hasExistingPermanentAccounts:
        availableCashAndBank.length > 0 && availableRetainedEarnings.length > 0,
      availableCashAndBankAccounts: availableCashAndBank,
      availableRetainedEarningsAccounts: availableRetainedEarnings,
      permanentAccounts,
    };
  }

  async validateAndCreateInitialAccounts(
    tx: Tx,
    userId: string,
    req: {
      cashAccountCode: string;
      cashAccountName: string;
      bankAccountCode: string;
      bankAccountName: string;
      retainedEarningsAccountCode: string;
      retainedEarningsAccountName: string;
    }
  ) {
    const cashCode = parseInt(req.cashAccountCode, 10);
    const bankCode = parseInt(req.bankAccountCode, 10);
    const retainedCode = parseInt(req.retainedEarningsAccountCode, 10);

    if (Number.isNaN(cashCode) || Number.isNaN(bankCode) || Number.isNaN(retainedCode)) {
      throw new Error('Account reference codes must be numeric.');
    }
    if (cashCode === bankCode || cashCode === retainedCode || bankCode === retainedCode) {
      throw new Error(
        'Cash, Bank, and Retained Earnings accounts must use different reference numbers.'
      );
    }

    const codeInUse = await tx.query.chartOfAccounts.findFirst({
      where: and(
        eq(accountSchema.chartOfAccounts.userId, userId),
        inArray(accountSchema.chartOfAccounts.referenceNumber, [
          cashCode,
          bankCode,
          retainedCode,
        ])
      ),
    });
    if (codeInUse) {
      throw new Error(
        'One or more account reference numbers are already in use in your Chart of Accounts.'
      );
    }

    const [cashAccount] = await tx
      .insert(accountSchema.chartOfAccounts)
      .values({
        userId,
        referenceNumber: cashCode,
        accountName: req.cashAccountName.trim(),
        type: 'Assets',
        role: 'CashAndEquivalents',
        isActive: true,
      })
      .returning();

    const [bankAccount] = await tx
      .insert(accountSchema.chartOfAccounts)
      .values({
        userId,
        referenceNumber: bankCode,
        accountName: req.bankAccountName.trim(),
        type: 'Assets',
        role: 'CashAndEquivalents',
        isActive: true,
      })
      .returning();

    const [retainedAccount] = await tx
      .insert(accountSchema.chartOfAccounts)
      .values({
        userId,
        referenceNumber: retainedCode,
        accountName: req.retainedEarningsAccountName.trim(),
        type: 'Equity',
        role: 'RetainedEarnings',
        isActive: true,
      })
      .returning();

    return { cashAccount, bankAccount, retainedAccount };
  }
}
