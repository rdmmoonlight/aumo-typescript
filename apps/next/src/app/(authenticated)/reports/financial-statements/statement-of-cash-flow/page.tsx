"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { store } from "@/lib/store";
import { reportsApi } from "@/lib/store/(authenticated)/reports/reportsApi";
import { ArrowRight, Banknote, Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CashFlowSectionTable } from "../_components/cash-flow/CashFlowSectionTable";
import { ErrorAlert } from "../_components/common/ErrorAlert";
import { LoadingState } from "../_components/common/LoadingState";
import { NoPeriodCard } from "../_components/common/NoPeriodCard";
import { formatNumber } from "../_lib/formatters";
import { CashFlowLine } from "../_types";

export default function StatementOfCashFlowPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCashFlow() {
      setIsLoading(true);
      setIsError(false);
      setErrorMessage(null);

      try {
        const result = await store.dispatch(
          reportsApi.endpoints.getStatementOfCashFlow.initiate(),
        );

        if (!isMounted) return;

        if ("data" in result) {
          setData(result.data);
        } else if ("error" in result) {
          setIsError(true);
          const errData = result.error as any;
          setErrorMessage(
            errData?.data?.message || "Gagal memuat Laporan Arus Kas.",
          );
        }
      } catch (err: any) {
        if (!isMounted) return;
        setIsError(true);
        setErrorMessage(err?.message || "Terjadi kesalahan saat memuat data.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchCashFlow();

    return () => {
      isMounted = false;
    };
  }, []);

  const raw = data as any;
  const noPeriod = raw?.hasPeriodSelected === false;

  const operating: CashFlowLine[] = raw?.operatingActivities || [];
  const investing: CashFlowLine[] = raw?.investingActivities || [];
  const financing: CashFlowLine[] = raw?.financingActivities || [];
  const beginningCash = Number(raw?.beginningCash) || 0;

  const netOperating = useMemo(
    () => operating.reduce((s, i) => s + Number(i.amount || 0), 0),
    [operating],
  );
  const netInvesting = useMemo(
    () => investing.reduce((s, i) => s + Number(i.amount || 0), 0),
    [investing],
  );
  const netFinancing = useMemo(
    () => financing.reduce((s, i) => s + Number(i.amount || 0), 0),
    [financing],
  );
  const netChange = netOperating + netInvesting + netFinancing;
  const endingCash = beginningCash + netChange;

  if (isLoading) return <LoadingState text="Loading Cash Flow..." />;

  return (
    <div className="space-y-6">
      {isError && errorMessage && <ErrorAlert message={errorMessage} />}
      {noPeriod ? (
        <NoPeriodCard />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-h3 font-bold flex items-center gap-2">
                <Banknote className="text-emerald-500" size={22} /> Cash Flow
                Statement
              </h1>
              <p className="text-ui text-muted-foreground mt-1">
                Indirect method (IAS 7) • IDR
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 text-caption"
            >
              <Link href="/financial-statements/income-statement">
                <ArrowRight size={14} /> Income Statement
              </Link>
            </Button>
          </div>
          <Card className="overflow-hidden">
            <CardContent className="p-4 space-y-6 divide-y">
              <CashFlowSectionTable
                title="Cash Flows from Operating Activities"
                lines={operating}
                totalLabel="Net Cash from Operating"
                total={netOperating}
              />
              <div className="pt-6">
                <CashFlowSectionTable
                  title="Cash Flows from Investing Activities"
                  lines={investing}
                  totalLabel="Net Cash from Investing"
                  total={netInvesting}
                />
              </div>
              <div className="pt-6">
                <CashFlowSectionTable
                  title="Cash Flows from Financing Activities"
                  lines={financing}
                  totalLabel="Net Cash from Financing"
                  total={netFinancing}
                />
              </div>
              <div className="pt-6 space-y-2">
                <div className="flex justify-between font-bold text-body px-4">
                  <span>Net Increase (Decrease) in Cash</span>
                  <span
                    className={`font-mono ${
                      netChange < 0 ? "text-red-500" : "text-emerald-500"
                    }`}
                  >
                    {formatNumber(netChange)}
                  </span>
                </div>
                <div className="flex justify-between text-ui text-muted-foreground px-4">
                  <span>Cash, Beginning</span>
                  <span className="font-mono">
                    {formatNumber(beginningCash)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-body pt-2 border-t px-4">
                  <span className="text-sky-500">Cash, End of Period</span>
                  <span className="font-mono text-sky-500">
                    {formatNumber(endingCash)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Alert className="bg-sky-500/10 border-sky-500/20 text-ui">
            <Info size={16} />
            <AlertDescription className="text-caption">
              Prepared using Indirect Method per IAS 7.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
