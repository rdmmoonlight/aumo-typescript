export interface LedgerLine {
  journalEntryId?: number;
  entryDate: string;
  description?: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface LedgerAccount {
  accountId: number;
  referenceNumber: number;
  accountName: string;
  type: string;
  normalBalanceIsDebit?: boolean;
  endingBalance: number;
  lines: LedgerLine[];
}

// biar gak breaking import lama
export type LedgerLineViewModel = LedgerLine;
export type LedgerAccountViewModel = LedgerAccount;
export type TemporaryLedgerLine = LedgerLine;
export type TemporaryLedgerAccount = LedgerAccount;

export interface GeneralLedgerResponse {
  hasPeriodSelected?: boolean;
  ledgers: LedgerAccount[];
  netIncomeBeforeClosing?: number;
}
