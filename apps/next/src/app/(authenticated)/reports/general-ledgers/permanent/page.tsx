"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { store } from "@/lib/store";
import { reportsApi } from "@/lib/store/(authenticated)/reports/reportsApi";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { LedgerCard } from "../_components/ledger-card";
import { NoPeriodState } from "../_components/no-period-state";
import { PageHeader } from "../_components/page-header";

export default function GeneralLedgerPermanentPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function fetchPermanentLedger() {
      setIsLoading(true);
      setIsError(false);

      const result = await store.dispatch(
        reportsApi.endpoints.getGeneralLedgerPermanent.initiate(undefined, {
          forceRefetch: true,
        }),
      );

      if (!isMounted) return;

      if (result.data) {
        setData(result.data);
      } else if (result.error) {
        setIsError(true);
        const err = result.error as any;
        setErrorMessage(
          err?.data?.message || "Failed to load permanent ledger.",
        );
      }

      setIsLoading(false);
    }

    fetchPermanentLedger();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
        <Loader2 className="animate-spin" size={16} /> Loading Permanent
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
      {isError && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertDescription className="text-xs">
            {errorMessage || "Failed to load"}
          </AlertDescription>
        </Alert>
      )}

      <PageHeader
        title="Permanent Ledger"
        subtitle={`Assets, Liabilities, Equity • ${ledgers.length} accounts • IDR`}
        switchHref="/reports/general-ledgers/temporary"
        switchLabel="View Temporary"
      />

      <div className="space-y-4">
        {ledgers.map((l: any) => (
          <LedgerCard key={l.accountId} ledger={l} />
        ))}
      </div>
    </div>
  );
}
