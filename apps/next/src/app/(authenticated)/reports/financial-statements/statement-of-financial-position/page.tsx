"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { store } from "@/lib/store";
import { reportsApi } from "@/lib/store/(authenticated)/reports/reportsApi";
import { AlertCircle, ArrowRight, CheckCircle2, Landmark } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ErrorAlert } from "../_components/common/ErrorAlert";
import { LoadingState } from "../_components/common/LoadingState";
import { NoPeriodCard } from "../_components/common/NoPeriodCard";
import { FinancialPositionSectionTable } from "../_components/financial-position/FinancialPositionSectionTable";
import { formatDateDisplay, formatNumber } from "../_lib/formatters";
import { FinancialPositionLine } from "../_types";

export default function StatementOfFinancialPositionPage() {
  const [raw, setRaw] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);

    try {
      // Memanggil endpoint langsung dari RTK Query tanpa Hook generator
      const result = await store.dispatch(
        reportsApi.endpoints.getStatementOfFinancialPosition.initiate({}),
      );

      if (result.isSuccess) {
        setRaw(result.data);
      } else if (result.isError) {
        setIsError(true);
        const err = result.error as any;
        setErrorMessage(err?.data?.message || "Gagal memuat laporan.");
      }
    } catch (e: any) {
      setIsError(true);
      setErrorMessage(e?.message || "Terjadi kesalahan koneksi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const noPeriod = raw?.hasPeriodSelected === false;

  const {
    assets,
    liabilities,
    equityExcludingRE,
    retainedEarningsEnding,
    asOfDate,
  } = useMemo(() => {
    const assetsList: FinancialPositionLine[] =
      raw?.assetAccounts || raw?.assets || [];
    const liabList: FinancialPositionLine[] =
      raw?.liabilityAccounts || raw?.liabilities || [];
    const rawEquity: FinancialPositionLine[] = raw?.equityAccounts || [];
    const equityExcludingRE = rawEquity.filter(
      (e) => e.accountName !== "Retained Earnings",
    );
    const reItem = rawEquity.find((e) => e.accountName === "Retained Earnings");

    return {
      assets: assetsList,
      liabilities: liabList,
      equityExcludingRE,
      retainedEarningsEnding: reItem
        ? Number(reItem.amount)
        : Number(raw?.retainedEarningsEnding) || 0,
      asOfDate: raw?.asOfDate || "",
    };
  }, [raw]);

  const equityLines = useMemo(
    () => [
      ...equityExcludingRE,
      {
        accountName: `Retained earnings, ${formatDateDisplay(asOfDate)}`,
        amount: retainedEarningsEnding,
      },
    ],
    [equityExcludingRE, retainedEarningsEnding, asOfDate],
  );

  const totalAssets = useMemo(
    () => assets.reduce((s, i) => s + Number(i.amount || 0), 0),
    [assets],
  );
  const totalLiabilities = useMemo(
    () => liabilities.reduce((s, i) => s + Number(i.amount || 0), 0),
    [liabilities],
  );
  const totalEquity = useMemo(
    () =>
      equityExcludingRE.reduce((s, i) => s + Number(i.amount || 0), 0) +
      retainedEarningsEnding,
    [equityExcludingRE, retainedEarningsEnding],
  );

  const totalLiabEquity = totalLiabilities + totalEquity;
  const isBalanced = Math.abs(totalAssets - totalLiabEquity) < 0.01;

  if (isLoading) return <LoadingState text="Loading Balance Sheet..." />;

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
                <Landmark className="text-sky-500" size={22} /> Statement of
                Financial Position
              </h1>
              <p className="text-ui text-muted-foreground mt-1">
                As of {formatDateDisplay(asOfDate) || "current"} • IAS 1 • IDR
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchData()}>
                Refresh
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/financial-statements/income-statement">
                  <ArrowRight size={14} /> Income Statement
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-4 items-start">
            <FinancialPositionSectionTable
              title="Assets"
              lines={assets}
              totalAmount={totalAssets}
              totalLabel="Total Assets"
              emptyMessage="No assets."
              totalColorClass="text-sky-500 font-bold"
            />
            <div className="space-y-4">
              <FinancialPositionSectionTable
                title="Liabilities"
                lines={liabilities}
                totalAmount={totalLiabilities}
                totalLabel="Total Liabilities"
                emptyMessage="No liabilities."
              />
              <FinancialPositionSectionTable
                title="Equity"
                lines={equityLines}
                totalAmount={totalEquity}
                totalLabel="Total Equity"
                emptyMessage="No equity."
              />
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex justify-between font-bold text-body">
                  <span>Total Liabilities & Equity</span>
                  <span className="font-mono text-sky-500">
                    {formatNumber(totalLiabEquity)}
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
          <Alert
            className={
              isBalanced
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-red-500/10 border-red-500/20"
            }
          >
            {isBalanced ? (
              <CheckCircle2 size={16} className="text-emerald-500" />
            ) : (
              <AlertCircle size={16} className="text-red-500" />
            )}
            <AlertDescription className="text-caption">
              {isBalanced
                ? "Balanced: Assets = Liabilities + Equity"
                : "Not Balanced. Check journal entries."}
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
