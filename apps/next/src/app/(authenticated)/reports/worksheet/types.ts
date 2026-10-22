export interface WorksheetRow {
  accountId: number;
  referenceNumber: number;
  accountName: string;
  type: string;
  normalBalanceIsDebit: boolean;
  unadjustedDebit: number;
  unadjustedCredit: number;
  adjustmentDebit: number;
  adjustmentCredit: number;
  adjustedDebit: number;
  adjustedCredit: number;
  incomeStatementDebit: number;
  incomeStatementCredit: number;
  financialPositionDebit: number;
  financialPositionCredit: number;
}

export interface WorksheetViewModel {
  rows: WorksheetRow[];
  netIncome: number;
  hasPeriodSelected: boolean;
}

export interface WorksheetTotals {
  unadjustedDebit: number;
  unadjustedCredit: number;
  adjustmentDebit: number;
  adjustmentCredit: number;
  adjustedDebit: number;
  adjustedCredit: number;
  isDebit: number;
  isCredit: number;
  bsDebit: number;
  bsCredit: number;
}
