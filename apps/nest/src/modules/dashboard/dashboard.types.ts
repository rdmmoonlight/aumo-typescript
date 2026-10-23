import { ApiResponse } from '../../common/types/api-response.type.js';

export interface CashAccountBreakdown {
    accountId: string;
    referenceNumber: string | null;
    accountName: string;
    balance: number;
    isBank: boolean;
}

export interface ExpenseBreakdown {
    accountId: string;
    referenceNumber: string | null;
    accountName: string;
    balance: number;
}

export interface TrendPoint {
    label: string; // MMM atau dd MMM
    revenue: number;
    expense: number;
    net: number;
}

export interface DashboardData {
    hasPeriodSelected: boolean;
    selectedPeriodName: string;
    isPeriodClosed: boolean;

    // REAL per tab (dipakai FE)
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

    // Kumulatif
    totalAssetsCumulative: number;
    totalCashOnHandCumulative: number;
    totalBankBalanceCumulative: number;
    totalLiabilitiesCumulative: number;

    totalEquity: number;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;

    cashAccounts: CashAccountBreakdown[];
    bankAccounts: CashAccountBreakdown[];
    cashAccountsMonthly: CashAccountBreakdown[];
    bankAccountsMonthly: CashAccountBreakdown[];
    cashAccountsAnnual: CashAccountBreakdown[];
    bankAccountsAnnual: CashAccountBreakdown[];

    expenseAccountsList: ExpenseBreakdown[];
    chartTrend: TrendPoint[];
    recentEntries: unknown[];
}

export type DashboardResponse = ApiResponse<DashboardData>;