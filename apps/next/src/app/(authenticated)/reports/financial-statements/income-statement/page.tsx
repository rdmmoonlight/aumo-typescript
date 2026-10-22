"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { store } from "@/lib/store";
import { reportsApi } from "@/lib/store/(authenticated)/reports/reportsApi";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ErrorAlert } from "../_components/common/ErrorAlert";
import { LoadingState } from "../_components/common/LoadingState";
import { NoPeriodCard } from "../_components/common/NoPeriodCard";
import { IncomeStatementSectionTable } from "../_components/income-statement/IncomeStatementSectionTable";
import { formatDateDisplay, formatNumber } from "../_lib/formatters";
import { IncomeStatementLine } from "../_types";

export default function IncomeStatementPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchIncomeStatement() {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      const result = await store.dispatch(
        reportsApi.endpoints.getIncomeStatement.initiate(),
      );

      if (!isMounted) return;

      if ("data" in result && result.data) {
        setData(result.data);
      } else if ("error" in result) {
        setIsError(true);
        setError(result.error);
      }

      setIsLoading(false);
    }

    fetchIncomeStatement();

    return () => {
      isMounted = false;
    };
  }, []);

  const raw = data as any;
  const noPeriod = raw?.hasPeriodSelected === false;

  const revenues: IncomeStatementLine[] =
    raw?.revenues || raw?.revenueAccounts || raw?.income || [];
  const cogs: IncomeStatementLine[] = raw?.costOfGoodsSold || raw?.cogs || [];
  const expenses: IncomeStatementLine[] =
    raw?.operatingExpenses || raw?.expenses || [];
  const other: IncomeStatementLine[] =
    raw?.otherIncomeExpenses || raw?.otherIncome || [];

  const totalRevenue = useMemo(
    () => revenues.reduce((s, i) => s + Number(i.amount || 0), 0),
    [revenues],
  );
  const totalCogs = useMemo(
    () => cogs.reduce((s, i) => s + Number(i.amount || 0), 0),
    [cogs],
  );
  const grossProfit = useMemo(
    () => raw?.grossProfit ?? totalRevenue - totalCogs,
    [raw, totalRevenue, totalCogs],
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((s, i) => s + Number(i.amount || 0), 0),
    [expenses],
  );
  const operatingIncome = useMemo(
    () => raw?.operatingIncome ?? grossProfit - totalExpenses,
    [raw, grossProfit, totalExpenses],
  );
  const totalOther = useMemo(
    () => other.reduce((s, i) => s + Number(i.amount || 0), 0),
    [other],
  );
  const netIncome = useMemo(
    () => raw?.netIncome ?? operatingIncome + totalOther,
    [raw, operatingIncome, totalOther],
  );

  if (isLoading) return <LoadingState text="Loading Income Statement..." />;
  const errorMessage = isError
    ? (error as any)?.data?.message || "Gagal memuat Income Statement."
    : null;

  return (
    <div className="space-y-6">
      {errorMessage && <ErrorAlert message={errorMessage} />}
      {noPeriod ? (
        <NoPeriodCard />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-h3 font-bold flex items-center gap-2">
                <TrendingUp className="text-emerald-500" size={22} /> Income
                Statement
              </h1>
              <p className="text-ui text-muted-foreground mt-1">
                {formatDateDisplay(raw?.startDate)} →{" "}
                {formatDateDisplay(raw?.endDate)} • IDR
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/financial-statements/retained-earnings">
                  Retained Earnings
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href="/financial-statements/statement-of-cash-flow">
                  <ArrowRight size={14} /> Cash Flow
                </Link>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-body">Profit & Loss</CardTitle>
              <CardDescription className="text-caption">
                IAS 1 • Accrual Basis
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-6 divide-y">
              <IncomeStatementSectionTable
                title="Revenue"
                lines={revenues}
                totalLabel="Total Revenue"
                total={totalRevenue}
              />
              <div className="pt-6">
                <IncomeStatementSectionTable
                  title="Cost of Goods Sold"
                  lines={cogs}
                  totalLabel="Total COGS"
                  total={totalCogs}
                />
              </div>

              <div className="pt-6 flex justify-between font-bold text-body px-4">
                <span>Gross Profit</span>
                <span className="font-mono text-sky-600">
                  {formatNumber(grossProfit)}
                </span>
              </div>

              <div className="pt-6">
                <IncomeStatementSectionTable
                  title="Operating Expenses"
                  lines={expenses}
                  totalLabel="Total Operating Expenses"
                  total={totalExpenses}
                />
              </div>

              <div className="pt-6 flex justify-between font-semibold text-body px-4">
                <span>Operating Income</span>
                <span className="font-mono">
                  {formatNumber(operatingIncome)}
                </span>
              </div>

              {other.length > 0 && (
                <div className="pt-6">
                  <IncomeStatementSectionTable
                    title="Other Income / Expenses"
                    lines={other}
                    totalLabel="Total Other"
                    total={totalOther}
                  />
                </div>
              )}

              <div className="pt-6 flex justify-between font-bold text-h3 px-4 bg-primary/5 py-4 rounded-lg">
                <span>Net Income</span>
                <span
                  className={`font-mono ${netIncome < 0 ? "text-red-500" : "text-emerald-600"}`}
                >
                  {formatNumber(netIncome)}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
