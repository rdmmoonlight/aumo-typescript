"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { store } from "@/lib/store";
import {
  reportsApi,
  type GetGeneralLedgerTemporaryApiResponse as GeneralLedgerTemporaryResponse,
} from "@/lib/store/(authenticated)/reports/reportsApi";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { LedgerCard } from "../_components/ledger-card";
import { NetIncomeCard } from "../_components/net-income-card";
import { NoPeriodState } from "../_components/no-period-state";
import { PageHeader } from "../_components/page-header";

export default function GeneralLedgerTemporaryPage() {
  const [data, setData] = useState<GeneralLedgerTemporaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchLedgerTemporary() {
      setIsLoading(true);
      setErrorMessage(null);

      const result = await store.dispatch(
        reportsApi.endpoints.getGeneralLedgerTemporary.initiate(undefined, {
          forceRefetch: true,
        }),
      );

      if (!isMounted) return;

      if (result.data) {
        setData(result.data);
      } else if (result.error) {
        const err = result.error as any;
        setErrorMessage(
          err?.data?.message ||
            err?.message ||
            "Failed to load temporary ledger.",
        );
      }

      setIsLoading(false);
    }

    fetchLedgerTemporary();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-muted-foreground flex justify-center gap-2">
        <Loader2 className="animate-spin" size={16} /> Loading Temporary
        Ledger...
      </div>
    );
  }

  if (data?.hasPeriodSelected === false) {
    return <NoPeriodState />;
  }

  const ledgers = data?.accounts ?? [];

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertDescription className="text-xs">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <PageHeader
        title="Temporary Ledger"
        subtitle={`Revenue & Expense • ${ledgers.length} accounts • IDR`}
        switchHref="/reports/general-ledgers/permanent"
        switchLabel="View Permanent"
      />

      <NetIncomeCard netIncome={data?.netIncomeBeforeClosing ?? 0} />

      <div className="space-y-4">
        {ledgers.map((l: any) => (
          <LedgerCard key={l.accountId} ledger={l} />
        ))}
      </div>
    </div>
  );
}
