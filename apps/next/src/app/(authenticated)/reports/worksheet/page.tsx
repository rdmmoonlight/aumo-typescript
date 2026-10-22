"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { store } from "@/lib/store";
import { reportsApi } from "@/lib/store/(authenticated)/reports/reportsApi";
import {
  AlertTriangle,
  Calendar,
  EyeOff,
  Grid,
  Info,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { WorksheetRow, WorksheetTotals, WorksheetViewModel } from "./types";
import { formatNumber } from "./utils";
import { WorksheetTable } from "./worksheet-table";

export default function WorksheetPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchWorksheet() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        // Tembak endpoint /reports/worksheet langsung via store dispatch
        const result = await store.dispatch(
          reportsApi.endpoints.getWorksheet.initiate(),
        );

        if (!isMounted) return;

        if (result.isSuccess) {
          setData(result.data);
        } else if (result.isError && result.error) {
          const err = result.error as any;
          setErrorMessage(err?.data?.message || "Gagal memuat data worksheet.");
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage("Terjadi kesalahan koneksi.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchWorksheet();

    return () => {
      isMounted = false;
    };
  }, []);

  const vm: WorksheetViewModel = useMemo(() => {
    const rawData = data as any;
    if (!rawData) return { rows: [], netIncome: 0, hasPeriodSelected: true };
    const mappedRows: WorksheetRow[] = (rawData.rows || []).map((r: any) => ({
      accountId: Number(r.accountId) || 0,
      referenceNumber: Number(r.referenceNumber) || 0,
      accountName: r.accountName || "",
      type: r.type || "",
      normalBalanceIsDebit: r.normalBalanceIsDebit ?? true,
      unadjustedDebit: Number(r.tbDebit) || 0,
      unadjustedCredit: Number(r.tbCredit) || 0,
      adjustmentDebit: Number(r.adjDebit) || 0,
      adjustmentCredit: Number(r.adjCredit) || 0,
      adjustedDebit: Number(r.adjTbDebit) || 0,
      adjustedCredit: Number(r.adjTbCredit) || 0,
      incomeStatementDebit: Number(r.isDebit) || 0,
      incomeStatementCredit: Number(r.isCredit) || 0,
      financialPositionDebit: Number(r.bsDebit) || 0,
      financialPositionCredit: Number(r.bsCredit) || 0,
    }));
    return {
      rows: mappedRows,
      netIncome: Number(rawData.totals?.netIncome) || 0,
      hasPeriodSelected: rawData.hasPeriodSelected !== false,
    };
  }, [data]);

  const totals: WorksheetTotals = useMemo(
    () =>
      vm.rows.reduce(
        (acc, r) => {
          acc.unadjustedDebit += r.unadjustedDebit;
          acc.unadjustedCredit += r.unadjustedCredit;
          acc.adjustmentDebit += r.adjustmentDebit;
          acc.adjustmentCredit += r.adjustmentCredit;
          acc.adjustedDebit += r.adjustedDebit;
          acc.adjustedCredit += r.adjustedCredit;
          acc.isDebit += r.incomeStatementDebit;
          acc.isCredit += r.incomeStatementCredit;
          acc.bsDebit += r.financialPositionDebit;
          acc.bsCredit += r.financialPositionCredit;
          return acc;
        },
        {
          unadjustedDebit: 0,
          unadjustedCredit: 0,
          adjustmentDebit: 0,
          adjustmentCredit: 0,
          adjustedDebit: 0,
          adjustedCredit: 0,
          isDebit: 0,
          isCredit: 0,
          bsDebit: 0,
          bsCredit: 0,
        },
      ),
    [vm.rows],
  );

  if (isLoading) {
    return (
      <div className="py-16 text-center flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="animate-spin" size={16} /> Loading Worksheet...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {!vm.hasPeriodSelected ? (
        <Card className="py-16 text-center border-dashed">
          <CardContent className="space-y-3">
            <EyeOff size={36} className="mx-auto text-muted-foreground" />
            <h3 className="font-semibold">No Period Selected</h3>
            <Button asChild size="sm">
              <Link href="/periods" className="gap-1.5">
                <Calendar size={14} /> Go to Periods
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-h3 font-bold flex items-center gap-2">
                <Grid className="text-sky-500" size={22} /> 10-Column Worksheet
              </h1>
              <p className="text-ui text-muted-foreground mt-1">
                Trial Balance → Adjustments → Adjusted TB → Income Statement →
                Balance Sheet • IDR
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/reports/income-statement">
                <TrendingUp size={14} /> Income Statement
              </Link>
            </Button>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-0 overflow-auto">
              <WorksheetTable
                rows={vm.rows}
                totals={totals}
                netIncome={vm.netIncome}
              />
            </CardContent>
          </Card>

          <Alert className="bg-sky-500/10 border-sky-500/20">
            <Info size={16} />
            <AlertDescription>
              Net Income: <strong>{formatNumber(vm.netIncome)}</strong> —
              plugged from Income Statement to Balance Sheet.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
