"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { store } from "@/lib/store";
import { reportsApi } from "@/lib/store/(authenticated)/reports/reportsApi";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BalanceAlert } from "../_components/balance-alert";
import { NoPeriodCard } from "../_components/no-period-card";
import { TrialTable } from "../_components/trial-table";
import { TrialRow } from "../_lib/types";

export default function PostClosingTrialBalancePage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPostClosingData() {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      // Menembak endpoint statementOfFinancialPosition secara manual via store.dispatch
      const result = await store.dispatch(
        reportsApi.endpoints.getStatementOfFinancialPosition.initiate({
          isPostClosing: true,
        }),
      );

      if (!isMounted) return;

      if (result.isSuccess) {
        setData(result.data);
      } else if (result.isError) {
        setIsError(true);
        setError(result.error);
      }

      setIsLoading(false);
    }

    fetchPostClosingData();

    return () => {
      isMounted = false;
    };
  }, []);

  const noPeriod = useMemo(
    () =>
      (error as any)?.status === 404 ||
      (data as any)?.hasPeriodSelected === false,
    [data, error],
  );

  const rows = useMemo<TrialRow[]>(() => {
    if (!data || noPeriod) return [];
    const raw = data as any;
    const assets = raw?.assetAccounts || raw?.assets || [];
    const liabs = raw?.liabilityAccounts || raw?.liabilities || [];
    const rawEquity =
      raw?.equityAccounts || raw?.equityExcludingRetainedEarnings || [];
    const reItem = rawEquity.find(
      (e: any) => e.accountName === "Retained Earnings",
    );
    const reEnding = reItem
      ? Number(reItem.amount)
      : Number(raw?.retainedEarningsEnding) || 0;
    const equityEx = rawEquity.filter(
      (e: any) => e.accountName !== "Retained Earnings",
    );
    return [
      ...assets.map((a: any) => ({
        accountId: a.accountId || a.referenceNumber,
        referenceNumber: a.referenceNumber,
        accountName: a.accountName,
        type: "Assets",
        normalBalanceIsDebit: true,
        debit: Number(a.amount) || 0,
        credit: 0,
      })),
      ...liabs.map((l: any) => ({
        accountId: l.accountId || l.referenceNumber,
        referenceNumber: l.referenceNumber,
        accountName: l.accountName,
        type: "Liabilities",
        normalBalanceIsDebit: false,
        debit: 0,
        credit: Number(l.amount) || 0,
      })),
      ...equityEx.map((e: any) => ({
        accountId: e.accountId || e.referenceNumber,
        referenceNumber: e.referenceNumber,
        accountName: e.accountName,
        type: "Equity",
        normalBalanceIsDebit: false,
        debit: 0,
        credit: Number(e.amount) || 0,
      })),
      {
        accountId: 0,
        referenceNumber: 0,
        accountName: "Retained Earnings",
        type: "Equity",
        normalBalanceIsDebit: false,
        debit: reEnding < 0 ? Math.abs(reEnding) : 0,
        credit: reEnding >= 0 ? reEnding : 0,
      },
    ];
  }, [data, noPeriod]);

  const totalDebit = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.debit) || 0), 0),
    [rows],
  );
  const totalCredit = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.credit) || 0), 0),
    [rows],
  );
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  if (isLoading) {
    return (
      <div className="py-16 text-center text-caption text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="animate-spin" size={16} /> Loading post-closing...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h3 font-bold flex items-center gap-2">
          <ShieldCheck className="text-emerald-500" size={22} /> Post-Closing
          Trial Balance
        </h1>
        <p className="text-ui text-muted-foreground mt-1">
          After closing entries • Only permanent accounts • IDR
        </p>
      </div>
      {isError && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertDescription>
            {(error as any)?.data?.message ||
              "Failed to load post-closing trial balance."}
          </AlertDescription>
        </Alert>
      )}
      {noPeriod ? (
        <NoPeriodCard message="Select a period to view post-closing balance." />
      ) : (
        <>
          <TrialTable
            rows={rows}
            totalDebit={totalDebit}
            totalCredit={totalCredit}
          />
          <BalanceAlert
            isBalanced={isBalanced}
            balancedText="Post-closing TB is balanced - ready for next period"
            unbalancedText="Out of balance - check closing entries"
          />
        </>
      )}
    </div>
  );
}
