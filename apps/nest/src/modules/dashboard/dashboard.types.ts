/** Bentuk JSON sama dengan DashboardController sumber (accountId dan referenceNumber berupa angka). */
export interface CashAccountItem {
    accountId: number;
    referenceNumber: number;
    accountName: string;
    balance: number;
    isBank: boolean;
}

export interface ExpenseAccountItem {
    accountId: number;
    referenceNumber: number;
    accountName: string;
    balance: number;
}

export interface TrendPoint {
    label: string;
    revenue: number;
    expense: number;
    net: number;
}

export interface DashboardResponse {
    success: true;
    hasPeriodSelected: boolean;
    selectedPeriodName: string;
    isPeriodClosed: boolean;
    totalAssets: number;
    totalCashOnHand: number;
    totalBankBalance: number;
    totalLiabilities: number;
    totalAssetsMonthly: number;
    totalAssetsAnnual: number;
    totalCashOnHandMonthly: number;
    totalCashOnHandAnnual: number;
    totalBankBalanceMonthly: number;
    totalBankBalanceAnnual: number;
    totalLiabilitiesMonthly: number;
    totalLiabilitiesAnnual: number;
    totalAssetsCumulative: number;
    totalCashOnHandCumulative: number;
    totalBankBalanceCumulative: number;
    totalLiabilitiesCumulative: number;
    totalEquity: number;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    cashAccounts: CashAccountItem[];
    bankAccounts: CashAccountItem[];
    cashAccountsMonthly: CashAccountItem[];
    bankAccountsMonthly: CashAccountItem[];
    cashAccountsAnnual: CashAccountItem[];
    bankAccountsAnnual: CashAccountItem[];
    expenseAccountsList: ExpenseAccountItem[];
    chartTrend: TrendPoint[];
    recentEntries: never[];
}
