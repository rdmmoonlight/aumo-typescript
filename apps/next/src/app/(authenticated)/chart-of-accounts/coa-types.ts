export interface ChartOfAccount {
  id: number;
  referenceNumber: number | string;
  accountName: string;
  type: string;
  role?: string;
  balance?: number;
  isActive?: boolean;
}

export type AccountItem = ChartOfAccount;

export const ACCOUNT_TYPES = [
  "Assets",
  "Liabilities",
  "Equity",
  "OperatingIncome",
  "OperatingExpenses",
  "OtherIncome",
  "OtherExpenses",
];

export const ACCOUNT_RANGES: Record<
  string,
  { start: number; end: number; label: string }
> = {
  Assets: { start: 100, end: 199, label: "Assets (100-199)" },
  Liabilities: { start: 200, end: 299, label: "Liabilities (200-299)" },
  Equity: { start: 300, end: 399, label: "Equity (300-399)" },
  OperatingIncome: {
    start: 400,
    end: 499,
    label: "Operating Income (400-499)",
  },
  OperatingExpenses: {
    start: 500,
    end: 599,
    label: "Operating Expenses (500-599)",
  },
  OtherIncome: { start: 600, end: 799, label: "Other Income (600-799)" },
  OtherExpenses: { start: 800, end: 999, label: "Other Expenses (800-999)" },
};
