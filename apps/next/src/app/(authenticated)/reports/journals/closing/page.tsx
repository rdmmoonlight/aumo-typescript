"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { store } from "@/lib/store";
import { reportsApi } from "@/lib/store/(authenticated)/reports/reportsApi";
import { ArrowRight, Info, Loader2, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClosingGroupTable } from "../_components/closing-group-table";
import { NoPeriodState } from "../_components/no-period-state";
import { formatNumberWithParen } from "../_lib/format";
import { ClosingJournalViewModel } from "../_lib/types";

export default function ClosingJournalReportPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  // Fetch data langsung dari controller ASP.NET Core via RTK Query Core Initiate
  useEffect(() => {
    let isMounted = true;

    async function fetchClosingJournal() {
      setIsLoading(true);
      setIsError(false);

      try {
        const result = await store.dispatch(
          reportsApi.endpoints.getJournalsClosing.initiate(),
        );

        if (isMounted) {
          if (result.isSuccess) {
            setData(result.data);
          } else {
            setIsError(true);
          }
        }
      } catch {
        if (isMounted) {
          setIsError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchClosingJournal();

    return () => {
      isMounted = false;
    };
  }, []);

  const { noPeriod, vm } = useMemo(() => {
    const d = data as any;
    if (!d || d?.hasPeriodSelected === false) {
      return {
        noPeriod: true,
        vm: {
          netIncome: 0,
          retainedEarningsAccountName: "Retained Earnings",
          groups: [],
        } as ClosingJournalViewModel,
      };
    }
    const cj = d?.closingJournal || d;
    return {
      noPeriod: false,
      vm: {
        netIncome: Number(cj?.netIncome) || 0,
        retainedEarningsAccountName:
          cj?.retainedEarningsAccountName || "Retained Earnings",
        groups: (cj?.groups || []).map((g: any) => ({
          description: g.description,
          lines: g.lines,
        })),
      } as ClosingJournalViewModel,
    };
  }, [data]);

  const totals = useMemo(
    () =>
      vm.groups.map((g) => ({
        totalDebit: g.lines.reduce((s, l) => s + (l.debit || 0), 0),
        totalCredit: g.lines.reduce((s, l) => s + (l.credit || 0), 0),
      })),
    [vm],
  );

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs flex justify-center items-center gap-2">
        <Loader2 className="animate-spin" size={16} /> Loading...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 text-center text-xs text-destructive">
        Gagal mengambil data laporan jurnal penutup dari server.
      </div>
    );
  }

  if (noPeriod) return <NoPeriodState />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Lock className="text-amber-500" size={22} /> Closing Journal
          </h1>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/reports/post-closing-trial-balance">
            <ArrowRight size={14} /> Post-Closing
          </Link>
        </Button>
      </div>

      {vm.groups.map((g, i) => (
        <ClosingGroupTable key={i} group={g} totals={totals[i]} />
      ))}

      <Alert className="bg-sky-500/10">
        <Info size={16} />
        <AlertDescription className="text-xs">
          Net Income <strong>{formatNumberWithParen(vm.netIncome)}</strong> will
          transfer to <strong>{vm.retainedEarningsAccountName}</strong>
        </AlertDescription>
      </Alert>
    </div>
  );
}
