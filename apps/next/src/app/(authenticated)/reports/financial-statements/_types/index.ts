export interface RetainedEarningsViewModel {
  accountName: string;
  startDate: string;
  endDate: string;
  beginningBalance: number;
  netIncome: number;
  dividends: number;
}
export interface StatementRow {
  id: string;
  label: string;
  amount: number;
  isIndent?: boolean;
  isTotal?: boolean;
  valueColorClass?: string;
  isNegativeFormat?: boolean;
}
export interface CashFlowLine {
  description: string;
  amount: number;
}
export interface FinancialPositionLine {
  referenceNumber?: number | string;
  accountName?: string;
  amount?: number | string;
}
export interface IncomeStatementLine {
  referenceNumber?: number | string;
  accountName?: string;
  description?: string;
  amount: number;
}
