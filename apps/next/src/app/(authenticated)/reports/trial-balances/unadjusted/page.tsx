"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { store } from "@/lib/store";
import { reportsApi } from "@/lib/store/(authenticated)/reports/reportsApi";
import { AlertTriangle, List, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BalanceAlert } from "../_components/balance-alert";
import { NoPeriodCard } from "../_components/no-period-card";
import { TrialTable } from "../_components/trial-table";
import { normalizeTrialRows } from "../_lib/normalize";

export default function UnadjustedTrialBalancePage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    // Memanggil endpoint via store.dispatch (Direct hit tanpa Hook)
    const result = await store.dispatch(
      reportsApi.endpoints.getTrialBalance.initiate({ type: "unadjusted" }),
    );

    if (result.isSuccess) {
      setData(result.data);
    } else if (result.isError) {
      setIsError(true);
      setError(result.error);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const noPeriod = useMemo(
    () =>
      data?.hasPeriodSelected === false ||
      (isError && (error as any)?.status === 404),
    [data, isError, error],
  );

  const rows = useMemo(() => {
    if (!data || noPeriod) return [];
    const raw: any[] = Array.isArray(data)
      ? data
      : data?.data || data?.rows || [];
    return normalizeTrialRows(raw);
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
      <div className="flex items-center justify-center gap-2 py-16 text-caption text-muted-foreground">
        <Loader2 className="animate-spin" size={16} /> Loading unadjusted trial
        balance...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-h3 font-bold">
          <List className="text-sky-500" size={22} /> Unadjusted Trial Balance
        </h1>
        <p className="mt-1 text-ui text-muted-foreground">
          Before adjustments • IDR
        </p>
      </div>

      {isError && !noPeriod && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertDescription>
            {(error as any)?.data?.message ||
              "Gagal memuat laporan trial balance."}
          </AlertDescription>
        </Alert>
      )}

      {noPeriod ? (
        <NoPeriodCard />
      ) : (
        <>
          <TrialTable
            rows={rows}
            totalDebit={totalDebit}
            totalCredit={totalCredit}
          />
          <BalanceAlert
            isBalanced={isBalanced}
            balancedText="Balanced: Debit = Credit"
            unbalancedText="Unbalanced - check journal entries"
          />
        </>
      )}
    </div>
  );
}
