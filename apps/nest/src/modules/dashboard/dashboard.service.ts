import { Injectable } from '@nestjs/common';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { db } from '../../db'; // sesuaikan path db drizzle kamu
import { accountingPeriods, chartOfAccounts, generalJournals } from '../../db/schema';
import { QueryDashboardDto } from './dashboard.schemas.js';
import { CashAccountBreakdown, DashboardData, ExpenseBreakdown, TrendPoint } from './dashboard.types.js';

type JournalLine = { accountId: string; debit: string | number; credit: string | number; entryDate: Date };

@Injectable()
export class DashboardService {
    private toNumber(v: string | number): number {
        return typeof v === 'string' ? parseFloat(v) : v ?? 0;
    }

    private isBankAccount(name: string): boolean {
        return /bank|rekening/i.test(name);
    }

    private async getSelectedPeriod(userId: string) {
        // Setara SelectedPeriodHelper.GetSelectedPeriodAsync
        const period = await db.query.accountingPeriods.findFirst({
            where: and(eq(accountingPeriods.userId, userId), eq(accountingPeriods.isSelected, true)),
            orderBy: (p, { desc }) => [desc(p.startDate)],
        });

        if (period) return period;

        // fallback: periode terbaru
        return await db.query.accountingPeriods.findFirst({
            where: eq(accountingPeriods.userId, userId),
            orderBy: (p, { desc }) => [desc(p.startDate)],
        });
    }

    private buildCashBreakdown(
        lines: JournalLine[],
        accounts: { id: string; referenceNumber: string | null; accountName: string }[],
    ): CashAccountBreakdown[] {
        return accounts.map((a) => {
            const bal = lines
                .filter((l) => l.accountId === a.id)
                .reduce((sum, l) => sum + (this.toNumber(l.debit) - this.toNumber(l.credit)), 0);
            return {
                accountId: a.id,
                referenceNumber: a.referenceNumber,
                accountName: a.accountName,
                balance: bal,
                isBank: this.isBankAccount(a.accountName),
            };
        });
    }

    async getDashboardData(userId: string, query: QueryDashboardDto): Promise<DashboardData> {
        const period = query.period ?? 'monthly';
        const activePeriod = await this.getSelectedPeriod(userId);

        const now = new Date();
        const year = activePeriod?.startDate ? new Date(activePeriod.startDate).getUTCFullYear() : now.getUTCFullYear();

        const monthlyStart = activePeriod?.startDate
            ? new Date(activePeriod.startDate)
            : new Date(Date.UTC(year, now.getUTCMonth(), 1, 0, 0, 0));

        const monthlyEnd = activePeriod?.endDate
            ? new Date(activePeriod.endDate)
            : new Date(Date.UTC(year, now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

        const annualStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
        const annualEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

        const isAnnual = period.toLowerCase() === 'annual';
        const reqEnd = isAnnual ? annualEnd : monthlyEnd;
        const displayPeriodName = isAnnual ? `Annual ${year}` : activePeriod?.periodName ?? 'Current Period';

        // Scope per tab - REAL bukan kumulatif
        const [monthlyLines, annualLines, cumulativeLines] = await Promise.all([
            db.select({
                accountId: generalJournals.accountId,
                debit: generalJournals.debit,
                credit: generalJournals.credit,
                entryDate: generalJournals.entryDate,
            })
                .from(generalJournals)
                .where(and(eq(generalJournals.userId, userId), gte(generalJournals.entryDate, monthlyStart), lte(generalJournals.entryDate, monthlyEnd))) as any,

            db.select({
                accountId: generalJournals.accountId,
                debit: generalJournals.debit,
                credit: generalJournals.credit,
                entryDate: generalJournals.entryDate,
            })
                .from(generalJournals)
                .where(and(eq(generalJournals.userId, userId), gte(generalJournals.entryDate, annualStart), lte(generalJournals.entryDate, annualEnd))) as any,

            db.select({
                accountId: generalJournals.accountId,
                debit: generalJournals.debit,
                credit: generalJournals.credit,
            })
                .from(generalJournals)
                .where(and(eq(generalJournals.userId, userId), lte(generalJournals.entryDate, reqEnd))) as any,
        ]);

        const periodLines = isAnnual ? annualLines : (monthlyLines as any);

        // 1. KAS & BANK
        const cashBankAccounts = await db
            .select({ id: chartOfAccounts.id, referenceNumber: chartOfAccounts.referenceNumber, accountName: chartOfAccounts.accountName })
            .from(chartOfAccounts)
            .where(and(eq(chartOfAccounts.userId, userId), eq(chartOfAccounts.isActive, true), eq(chartOfAccounts.role, 'CashAndEquivalents')) as any)
            .orderBy(chartOfAccounts.referenceNumber);

        const monthlyCashBreakdown = this.buildCashBreakdown(monthlyLines as any, cashBankAccounts);
        const annualCashBreakdown = this.buildCashBreakdown(annualLines as any, cashBankAccounts);
        const cumulativeCashBreakdown = this.buildCashBreakdown(cumulativeLines as any, cashBankAccounts);

        const totalCashOnHandMonthly = monthlyCashBreakdown.filter(x => !x.isBank).reduce((s, x) => s + x.balance, 0);
        const totalBankBalanceMonthly = monthlyCashBreakdown.filter(x => x.isBank).reduce((s, x) => s + x.balance, 0);
        const totalAssetsMonthly = monthlyCashBreakdown.reduce((s, x) => s + x.balance, 0);

        const totalCashOnHandAnnual = annualCashBreakdown.filter(x => !x.isBank).reduce((s, x) => s + x.balance, 0);
        const totalBankBalanceAnnual = annualCashBreakdown.filter(x => x.isBank).reduce((s, x) => s + x.balance, 0);
        const totalAssetsAnnual = annualCashBreakdown.reduce((s, x) => s + x.balance, 0);

        const totalCashOnHand = isAnnual ? totalCashOnHandAnnual : totalCashOnHandMonthly;
        const totalBankBalance = isAnnual ? totalBankBalanceAnnual : totalBankBalanceMonthly;
        const totalAssets = isAnnual ? totalAssetsAnnual : totalAssetsMonthly;

        // 2. PENDAPATAN & BEBAN
        const incomeTypes = ['OperatingIncome', 'Income', 'Revenue'];
        const incomeAccounts = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts)
            .where(and(eq(chartOfAccounts.userId, userId), eq(chartOfAccounts.isActive, true), inArray(chartOfAccounts.type, incomeTypes)) as any);
        const incomeIds = incomeAccounts.map(a => a.id);

        const totalIncome = periodLines
            .filter((l: any) => incomeIds.includes(l.accountId))
            .reduce((s: number, l: any) => s + (this.toNumber(l.credit) - this.toNumber(l.debit)), 0);

        const expenseTypes = ['OperatingExpenses', 'Expense', 'Expenses'];
        const expenseAccountsMeta = await db
            .select({ id: chartOfAccounts.id, referenceNumber: chartOfAccounts.referenceNumber, accountName: chartOfAccounts.accountName })
            .from(chartOfAccounts)
            .where(and(eq(chartOfAccounts.userId, userId), eq(chartOfAccounts.isActive, true), inArray(chartOfAccounts.type, expenseTypes)) as any)
            .orderBy(chartOfAccounts.referenceNumber);

        const expenseBreakdown: ExpenseBreakdown[] = expenseAccountsMeta
            .map((a) => {
                const bal = periodLines
                    .filter((l: any) => l.accountId === a.id)
                    .reduce((s: number, l: any) => s + (this.toNumber(l.debit) - this.toNumber(l.credit)), 0);
                return { accountId: a.id, referenceNumber: a.referenceNumber, accountName: a.accountName, balance: bal };
            })
            .filter(a => a.balance !== 0);

        const totalExpense = expenseBreakdown.filter(x => x.balance > 0).reduce((s, x) => s + x.balance, 0);
        const netIncome = totalIncome - totalExpense;

        // 3. LIABILITIES & EQUITY
        const liabilityTypes = ['Liabilities', 'Liability'];
        const liabilityAccounts = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts)
            .where(and(eq(chartOfAccounts.userId, userId), eq(chartOfAccounts.isActive, true), inArray(chartOfAccounts.type, liabilityTypes)) as any);
        const liabilityIds = liabilityAccounts.map(a => a.id);

        const calcLiab = (lines: any[]) => lines.filter(l => liabilityIds.includes(l.accountId))
            .reduce((s, l) => s + (this.toNumber(l.credit) - this.toNumber(l.debit)), 0);

        const totalLiabilitiesMonthly = calcLiab(monthlyLines as any);
        const totalLiabilitiesAnnual = calcLiab(annualLines as any);
        const totalLiabilities = isAnnual ? totalLiabilitiesAnnual : totalLiabilitiesMonthly;
        const totalLiabilitiesCumulative = calcLiab(cumulativeLines as any);

        const equityAccounts = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts)
            .where(and(eq(chartOfAccounts.userId, userId), eq(chartOfAccounts.isActive, true), eq(chartOfAccounts.type, 'Equity')) as any);
        const equityIds = equityAccounts.map(a => a.id);
        const totalEquity = cumulativeLines.filter(l => equityIds.includes(l.accountId))
            .reduce((s, l: any) => s + (this.toNumber(l.credit) - this.toNumber(l.debit)), 0);

        // 4. CHARTJS TREND - setara CultureInfo.InvariantCulture
        let chartTrend: TrendPoint[] = [];
        if (isAnnual) {
            chartTrend = Array.from({ length: 12 }, (_, i) => {
                const m = i + 1;
                const monthLines = (periodLines as any).filter((l: any) => new Date(l.entryDate).getUTCMonth() + 1 === m);
                const rev = monthLines.filter((l: any) => incomeIds.includes(l.accountId)).reduce((s: number, l: any) => s + (this.toNumber(l.credit) - this.toNumber(l.debit)), 0);
                const exp = monthLines.filter((l: any) => expenseAccountsMeta.map(e => e.id).includes(l.accountId)).reduce((s: number, l: any) => s + (this.toNumber(l.debit) - this.toNumber(l.credit)), 0);
                return {
                    label: new Date(Date.UTC(2000, m - 1, 1)).toLocaleString('en-US', { month: 'short' }), // Jan, Feb...
                    revenue: rev,
                    expense: exp,
                    net: rev - exp,
                };
            });
        } else {
            const grouped = new Map<string, any[]>();
            (periodLines as any).forEach((l: any) => {
                const key = new Date(l.entryDate).toISOString().slice(0, 10);
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key)!.push(l);
            });
            chartTrend = Array.from(grouped.entries())
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([dateStr, g]) => {
                    const rev = g.filter((l: any) => incomeIds.includes(l.accountId)).reduce((s: number, l: any) => s + (this.toNumber(l.credit) - this.toNumber(l.debit)), 0);
                    const exp = g.filter((l: any) => expenseAccountsMeta.map(e => e.id).includes(l.accountId)).reduce((s: number, l: any) => s + (this.toNumber(l.debit) - this.toNumber(l.credit)), 0);
                    const d = new Date(dateStr);
                    return {
                        label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), // 05 Jan
                        revenue: rev,
                        expense: exp,
                        net: rev - exp,
                    };
                });
        }

        return {
            hasPeriodSelected: !!activePeriod,
            selectedPeriodName: displayPeriodName,
            isPeriodClosed: activePeriod?.isClosed ?? false,

            totalAssets,
            totalCashOnHand,
            totalBankBalance,
            totalLiabilities,

            totalAssetsMonthly,
            totalAssetsAnnual,
            totalCashOnHandMonthly,
            totalCashOnHandAnnual,
            totalBankBalanceMonthly,
            totalBankBalanceAnnual,
            totalLiabilitiesMonthly,
            totalLiabilitiesAnnual,

            totalAssetsCumulative: cumulativeCashBreakdown.reduce((s, x) => s + x.balance, 0),
            totalCashOnHandCumulative: cumulativeCashBreakdown.filter(x => !x.isBank).reduce((s, x) => s + x.balance, 0),
            totalBankBalanceCumulative: cumulativeCashBreakdown.filter(x => x.isBank).reduce((s, x) => s + x.balance, 0),
            totalLiabilitiesCumulative,

            totalEquity,
            totalRevenue: totalIncome,
            totalExpenses: totalExpense,
            netIncome,

            cashAccounts: (isAnnual ? annualCashBreakdown : monthlyCashBreakdown).filter(x => !x.isBank),
            bankAccounts: (isAnnual ? annualCashBreakdown : monthlyCashBreakdown).filter(x => x.isBank),
            cashAccountsMonthly: monthlyCashBreakdown.filter(x => !x.isBank),
            bankAccountsMonthly: monthlyCashBreakdown.filter(x => x.isBank),
            cashAccountsAnnual: annualCashBreakdown.filter(x => !x.isBank),
            bankAccountsAnnual: annualCashBreakdown.filter(x => x.isBank),

            expenseAccountsList: expenseBreakdown,
            chartTrend,
            recentEntries: [],
        };
    }
}