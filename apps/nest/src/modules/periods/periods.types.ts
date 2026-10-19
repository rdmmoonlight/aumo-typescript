import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as accountSchema from '../../db/schema/chart-of-accounts.js';
import * as generalJournalSchema from '../../db/schema/general-journal.js';
import * as periodSchema from '../../db/schema/periods.js';

export type DrizzleDb = NodePgDatabase<
    typeof periodSchema & typeof accountSchema & typeof generalJournalSchema
>;

export type Tx = Parameters<Parameters<DrizzleDb['transaction']>[0]>[0];

export type PeriodSelect = typeof periodSchema.periods.$inferSelect;
export type AccountSelect = typeof accountSchema.chartOfAccounts.$inferSelect;
export type GeneralJournalInsert = typeof generalJournalSchema.generalJournal.$inferInsert;

export type BaseServiceResult = {
    success: boolean;
    message: string;
};

export type SelectPeriodResult = {
    success: true;
    selectedPeriodId: number;
    message: string;
};

export type CreatePeriodResult =
    | { success: true; message: string; periodId: number }
    | { success: false; message: string; isServerError?: boolean };

export type CreatePeriodRequest =
    | {
        year: number;
        month: number;
        setupMode: 'CreateNew';
        cashAccountCode?: string;
        cashAccountName?: string;
        bankAccountCode?: string;
        bankAccountName?: string;
        retainedEarningsAccountCode?: string;
        retainedEarningsAccountName?: string;
        cashBalance?: number;
        bankBalance?: number;
    }
    | {
        year: number;
        month: number;
        setupMode: 'LoadExisting';
        cashAccountId?: number;
        bankAccountId?: number;
        retainedEarningsAccountId?: number;
    };

export type AccountSimpleDto = Pick<
    AccountSelect,
    'id' | 'referenceNumber' | 'accountName' | 'type'
> & { displayLabel: string };

export type OpenPeriodInfoResponse = {
    success: true;
    hasExistingPermanentAccounts: boolean;
    availableCashAndBankAccounts: AccountSimpleDto[];
    availableRetainedEarningsAccounts: AccountSimpleDto[];
    permanentAccounts: AccountSimpleDto[];
};