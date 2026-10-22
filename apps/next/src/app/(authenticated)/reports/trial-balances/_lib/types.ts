export interface TrialRow {
  accountId: number;
  referenceNumber: number;
  accountName: string;
  type: string;
  normalBalanceIsDebit: boolean;
  netBalance?: number;
  debit?: number;
  credit?: number;
  amount?: number;
}
