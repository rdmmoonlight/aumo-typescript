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
import { ArrowRight, PiggyBank } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ErrorAlert } from "../_components/common/ErrorAlert";
import { LoadingState } from "../_components/common/LoadingState";
import { NoPeriodCard } from "../_components/common/NoPeriodCard";
import { RetainedEarningsTable } from "../_components/retained-earnings/RetainedEarningsTable";
import { formatDateDisplay } from "../_lib/formatters";
import { RetainedEarningsViewModel, StatementRow } from "../_types";

export default function RetainedEarningsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchRetainedEarnings() {
      setIsLoading(true);
      setErrorMessage(null);

      // Tembak langsung endpoint RTK Query tanpa Hook
      const result = await store.dispatch(
        reportsApi.endpoints.getRetainedEarnings.initiate(),
      );

      if (!isMounted) return;

      if ("data" in result) {
        setData(result.data);
      } else if ("error" in result) {
        const err = result.error as any;
        setErrorMessage(
          err?.data?.message || err?.message || "Gagal memuat laporan.",
        );
      }

      setIsLoading(false);
    }

    fetchRetainedEarnings();

    return () => {
      isMounted = false;
    };
  }, []);

  const rawData = data;
  const noPeriod = rawData?.hasPeriodSelected === false;

  const vm: RetainedEarningsViewModel = useMemo(
    () => ({
      accountName: rawData?.accountName || "Retained Earnings",
      startDate: rawData?.startDate || "",
      endDate: rawData?.endDate || "",
      beginningBalance:
        Number(
          rawData?.beginningRetainedEarnings ?? rawData?.beginningBalance,
        ) || 0,
      netIncome: Number(rawData?.netIncome) || 0,
      dividends: Number(rawData?.dividendsOrDraws ?? rawData?.dividends) || 0,
    }),
    [rawData],
  );

  const endingBalance = vm.beginningBalance + vm.netIncome - vm.dividends;

  const statementRows = useMemo<StatementRow[]>(() => {
    const rows: StatementRow[] = [
      {
        id: "beginning",
        label: `Retained earnings, ${formatDateDisplay(vm.startDate) || "start"}`,
        amount: vm.beginningBalance,
      },
      {
        id: "netIncome",
        label: "Add: Net Income",
        amount: vm.netIncome,
        isIndent: true,
        valueColorClass:
          vm.netIncome >= 0 ? "text-emerald-500" : "text-red-500",
      },
    ];
    if (vm.dividends !== 0) {
      rows.push({
        id: "dividends",
        label: "Less: Dividends / Withdrawals",
        amount: vm.dividends,
        isIndent: true,
        isNegativeFormat: true,
        valueColorClass: "text-red-500",
      });
    }
    rows.push({
      id: "ending",
      label: `Retained earnings, ${formatDateDisplay(vm.endDate) || "end"}`,
      amount: endingBalance,
      isTotal: true,
    });
    return rows;
  }, [vm, endingBalance]);

  if (isLoading) return <LoadingState text="Loading Retained Earnings..." />;

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
                <PiggyBank className="text-emerald-500" size={22} /> Retained
                Earnings Statement
              </h1>
              <p className="text-ui text-muted-foreground mt-1">
                Bridges Income Statement to Equity on Balance Sheet • IDR
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/reports/statement-of-financial-position">
                <ArrowRight size={14} /> Balance Sheet
              </Link>
            </Button>
          </div>
          <Card className="max-w-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-body">{vm.accountName}</CardTitle>
              <CardDescription className="text-caption">
                {formatDateDisplay(vm.startDate)} →{" "}
                {formatDateDisplay(vm.endDate)}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <RetainedEarningsTable data={statementRows} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
