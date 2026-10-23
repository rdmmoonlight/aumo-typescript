import { Injectable } from '@nestjs/common';
import { and, asc, eq, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { chartOfAccounts } from '../../db/schema/chart-of-accounts.js';
import { generalJournal } from '../../db/schema/general-journal.js';
import { periods } from '../../db/schema/periods.js';
import { InjectDrizzle } from '../drizzle/drizzle.decorator.js';
import { DashboardPeriod } from './dashboard.schemas.js';
import { CashAccountItem, DashboardResponse, ExpenseAccountItem, TrendPoint } from './dashboard.types.js';

type Line = { accountId: number; debit: number; credit: number; entryDate: Date };

const INCOME_TYPES = ['OperatingIncome', 'Income', 'Revenue'];
const EXPENSE_TYPES = ['OperatingExpenses', 'Expense', 'Expenses'];
const LIABILITY_TYPES = ['Liabilities', 'Liability'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Hitung dalam sen (bilangan bulat) agar jumlah desimal tepat seperti decimal di .NET. */
const cents = (value: string | number): number => Math.round(Number(value) * 100);
const fromCents = (value: number): number => value / 100;

const sumBy = <T>(items: T[], pick: (item: T) => number): number =>
    items.reduce((sum, item) => sum + pick(item), 0);

/** Setara pengecekan Contains("Bank"/"Rekening", IgnoreCase) di sumber. */
export function isBankAccount(name: string): boolean {
    return /bank|rekening/i.test(name);
}

@Injectable()
export class DashboardService {
    constructor(@InjectDrizzle() private readonly db: NodePgDatabase) { }

    /** Setara SelectedPeriodHelper.GetSelectedPeriodAsync. */
    private async selectedPeriod(userId: string) {
        const [period] = await this.db
            .select()
            .from(periods)
            .where(and(eq(periods.userId, userId), eq(periods.isSelected, true)))
            .limit(1);
        return period ?? null;
    }

    private async linesBetween(userId: string, from: Date | null, to: Date): Promise<Line[]> {
        const rows = await this.db
            .select({
                accountId: generalJournal.accountId,
                debit: generalJournal.debit,
                credit: generalJournal.credit,
                entryDate: generalJournal.entryDate,
            })
            .from(generalJournal)
            .where(and(eq(generalJournal.userId, userId), lte(generalJournal.entryDate, to)));
        return rows
            .filter((r) => from === null || r.entryDate.getTime() >= from.getTime())
            .map((r) => ({
                accountId: r.accountId,
                debit: cents(r.debit),
                credit: cents(r.credit),
                entryDate: r.entryDate,
            }));
    }

    async getDashboard(userId: string, period: DashboardPeriod): Promise<DashboardResponse> {
        const active = await this.selectedPeriod(userId);
        const now = new Date();

        const year = active ? active.startDate.getUTCFullYear() : now.getUTCFullYear();
        const monthlyStart = active
            ? active.startDate
            : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const monthlyEnd = active
            ? active.endDate
            : new Date(Date.UTC(monthlyStart.getUTCFullYear(), monthlyStart.getUTCMonth() + 1, 0, 23, 59, 59));
        const annualStart = new Date(Date.UTC(year, 0, 1));
        const annualEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

        const isAnnual = period === 'annual';
        const reqEnd = isAnnual ? annualEnd : monthlyEnd;
        const displayName = isAnnual ? `Annual ${year}` : (active?.periodName ?? 'Current Period');

        const [monthlyLines, annualLines, cumulativeLines] = await Promise.all([
            this.linesBetween(userId, monthlyStart, monthlyEnd),
            this.linesBetween(userId, annualStart, annualEnd),
            this.linesBetween(userId, null, reqEnd),
        ]);
        const periodLines = isAnnual ? annualLines : monthlyLines;

        const accounts = await this.db
            .select()
            .from(chartOfAccounts)
            .where(and(eq(chartOfAccounts.userId, userId), eq(chartOfAccounts.isActive, true)))
            .orderBy(asc(chartOfAccounts.referenceNumber));

        // 1. Kas dan bank
        const cashAccounts = accounts.filter((a) => a.role === 'CashAndEquivalents');
        const cashBreakdown = (lines: Line[]): CashAccountItem[] =>
            cashAccounts.map((a) => ({
                accountId: a.id,
                referenceNumber: a.referenceNumber,
                accountName: a.accountName,
                balance: fromCents(sumBy(lines.filter((l) => l.accountId === a.id), (l) => l.debit - l.credit)),
                isBank: isBankAccount(a.accountName),
            }));
        const monthlyCash = cashBreakdown(monthlyLines);
        const annualCash = cashBreakdown(annualLines);
        const cumulativeCash = cashBreakdown(cumulativeLines);

        const total = (items: CashAccountItem[], bank?: boolean): number =>
            fromCents(
                sumBy(
                    items.filter((x) => bank === undefined || x.isBank === bank),
                    (x) => cents(x.balance),
                ),
            );

        const totalCashOnHandMonthly = total(monthlyCash, false);
        const totalBankBalanceMonthly = total(monthlyCash, true);
        const totalAssetsMonthly = total(monthlyCash);
        const totalCashOnHandAnnual = total(annualCash, false);
        const totalBankBalanceAnnual = total(annualCash, true);
        const totalAssetsAnnual = total(annualCash);

        // 2. Pendapatan dan beban (cakupan periode terpilih)
        const incomeIds = new Set(accounts.filter((a) => INCOME_TYPES.includes(a.type)).map((a) => a.id));
        const expenseAccounts = accounts.filter((a) => EXPENSE_TYPES.includes(a.type));
        const expenseIds = new Set(expenseAccounts.map((a) => a.id));

        const revenueOf = (lines: Line[]): number =>
            sumBy(lines.filter((l) => incomeIds.has(l.accountId)), (l) => l.credit - l.debit);
        const expenseOf = (lines: Line[]): number =>
            sumBy(lines.filter((l) => expenseIds.has(l.accountId)), (l) => l.debit - l.credit);

        const totalIncome = revenueOf(periodLines);
        const expenseBreakdown: ExpenseAccountItem[] = expenseAccounts
            .map((a) => ({
                accountId: a.id,
                referenceNumber: a.referenceNumber,
                accountName: a.accountName,
                balance: sumBy(periodLines.filter((l) => l.accountId === a.id), (l) => l.debit - l.credit),
            }))
            .filter((a) => a.balance !== 0);
        const totalExpense = sumBy(
            expenseBreakdown.filter((x) => x.balance > 0),
            (x) => x.balance,
        );
        const expenseList = expenseBreakdown.map((x) => ({ ...x, balance: fromCents(x.balance) }));

        // 3. Kewajiban dan ekuitas
        const liabilityIds = new Set(accounts.filter((a) => LIABILITY_TYPES.includes(a.type)).map((a) => a.id));
        const equityIds = new Set(accounts.filter((a) => a.type === 'Equity').map((a) => a.id));
        const creditMinusDebit = (lines: Line[], ids: Set<number>): number =>
            fromCents(sumBy(lines.filter((l) => ids.has(l.accountId)), (l) => l.credit - l.debit));

        const totalLiabilitiesMonthly = creditMinusDebit(monthlyLines, liabilityIds);
        const totalLiabilitiesAnnual = creditMinusDebit(annualLines, liabilityIds);

        // 4. Tren grafik
        const point = (label: string, lines: Line[]): TrendPoint => {
            const revenue = revenueOf(lines);
            const expense = expenseOf(lines);
            return {
                label,
                revenue: fromCents(revenue),
                expense: fromCents(expense),
                net: fromCents(revenue - expense),
            };
        };
        let chartTrend: TrendPoint[];
        if (isAnnual) {
            chartTrend = MONTHS.map((label, i) =>
                point(label, periodLines.filter((l) => l.entryDate.getUTCMonth() === i)),
            );
        } else {
            const byDay = new Map<number, Line[]>();
            for (const line of periodLines) {
                const day = Date.UTC(
                    line.entryDate.getUTCFullYear(),
                    line.entryDate.getUTCMonth(),
                    line.entryDate.getUTCDate(),
                );
                byDay.set(day, [...(byDay.get(day) ?? []), line]);
            }
            chartTrend = [...byDay.entries()]
                .sort(([a], [b]) => a - b)
                .map(([day, lines]) => {
                    const d = new Date(day);
                    const label = `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]}`;
                    return point(label, lines);
                });
        }

        const activeCash = isAnnual ? annualCash : monthlyCash;
        return {
            success: true,
            hasPeriodSelected: active !== null,
            selectedPeriodName: displayName,
            isPeriodClosed: active?.isClosed ?? false,
            totalAssets: isAnnual ? totalAssetsAnnual : totalAssetsMonthly,
            totalCashOnHand: isAnnual ? totalCashOnHandAnnual : totalCashOnHandMonthly,
            totalBankBalance: isAnnual ? totalBankBalanceAnnual : totalBankBalanceMonthly,
            totalLiabilities: isAnnual ? totalLiabilitiesAnnual : totalLiabilitiesMonthly,
            totalAssetsMonthly,
            totalAssetsAnnual,
            totalCashOnHandMonthly,
            totalCashOnHandAnnual,
            totalBankBalanceMonthly,
            totalBankBalanceAnnual,
            totalLiabilitiesMonthly,
            totalLiabilitiesAnnual,
            totalAssetsCumulative: total(cumulativeCash),
            totalCashOnHandCumulative: total(cumulativeCash, false),
            totalBankBalanceCumulative: total(cumulativeCash, true),
            totalLiabilitiesCumulative: creditMinusDebit(cumulativeLines, liabilityIds),
            totalEquity: creditMinusDebit(cumulativeLines, equityIds),
            totalRevenue: fromCents(totalIncome),
            totalExpenses: fromCents(totalExpense),
            netIncome: fromCents(totalIncome - totalExpense),
            cashAccounts: activeCash.filter((x) => !x.isBank),
            bankAccounts: activeCash.filter((x) => x.isBank),
            cashAccountsMonthly: monthlyCash.filter((x) => !x.isBank),
            bankAccountsMonthly: monthlyCash.filter((x) => x.isBank),
            cashAccountsAnnual: annualCash.filter((x) => !x.isBank),
            bankAccountsAnnual: annualCash.filter((x) => x.isBank),
            expenseAccountsList: expenseList,
            chartTrend,
            recentEntries: [],
        };
    }
}
