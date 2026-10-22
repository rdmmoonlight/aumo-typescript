"use client";

import { store } from "@/lib/store";
import { chartOfAccountsApi } from "@/lib/store/(authenticated)/chart-of-accounts/chartOfAccountsApi";
import {
  AccountMappingDetailDto,
  toolsApi,
} from "@/lib/store/(authenticated)/tools/toolsApi";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertTriangle,
  Calendar,
  Check,
  Download,
  Eye,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { MONTHS } from "./constants";
import { MappingStatusTable } from "./mapping-status-table";
import { PreviewTransactionLinesTable } from "./preview-transaction-lines-table";
import {
  AccountMappingDetail,
  JournalImportResult,
  JournalLineImport,
  JournalTransactionImport,
} from "./types";

export default function ToolsPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoadingCoa, setIsLoadingCoa] = useState(false);

  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<JournalImportResult | null>(
    null,
  );
  const [accountMappings, setAccountMappings] = useState<
    AccountMappingDetail[]
  >([]);
  const [dbAccounts, setDbAccounts] = useState<any[]>([]);

  const isBusy = isParsing || isImporting;

  // --- Fetch COA List via Manual RTK Query Dispatch ---
  useEffect(() => {
    let isMounted = true;
    async function fetchCoa() {
      setIsLoadingCoa(true);
      try {
        const result = await store.dispatch(
          chartOfAccountsApi.endpoints.getChartOfAccounts.initiate(),
        );
        if (isMounted && result.data) {
          const raw = result.data;
          const accounts = Array.isArray(raw)
            ? raw
            : (raw as any)?.accounts || (raw as any)?.data || [];
          setDbAccounts(accounts);
        }
      } catch {
        // Ignored
      } finally {
        if (isMounted) setIsLoadingCoa(false);
      }
    }
    fetchCoa();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePreview = async () => {
    if (!selectedFile) {
      setErrorMessage("Select Excel first");
      return;
    }
    setIsParsing(true);
    setErrorMessage(null);
    try {
      if (!(window as any).XLSX) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src =
            "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
          s.onload = res as any;
          s.onerror = rej as any;
          document.head.appendChild(s);
        });
      }
      const XLSX = (window as any).XLSX;
      const buf = await selectedFile.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const parsed: JournalTransactionImport[] = [];
      const temp: Record<string, AccountMappingDetail> = {};
      let totalLines = 0;

      ["GJ", "AJ"].forEach((sheetName) => {
        const ws = wb.Sheets[sheetName];
        if (!ws) return;
        const rows: any[] = XLSX.utils.sheet_to_json(ws, {
          raw: true,
          defval: "",
        });
        let curDate = "";
        const grouped: Record<string, JournalLineImport[]> = {};

        rows.forEach((row, i) => {
          const rawDate = row["Date"] ?? "";
          let day = 1;
          if (/^\d{1,2}$/.test(String(rawDate).trim())) {
            day = parseInt(String(rawDate), 10);
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(String(rawDate))) {
            day = parseInt(String(rawDate).split("-")[2], 10);
          }

          if (rawDate) {
            curDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          }
          if (!curDate) return;

          const accountName = String(row["Account Name"] ?? "").trim();
          const description = String(row["Description"] ?? "").trim();
          const refVal = Number(row["Ref"] ?? 0);
          if (!accountName && !description && !refVal) return;

          const mapKey = `${refVal}|||${accountName}`;
          if (!temp[mapKey]) {
            temp[mapKey] = {
              excelRef: refVal,
              excelAccountName: accountName,
              mappedRef: 0,
              mappedAccountName: "",
              status: "UNMAPPED",
            };
          }

          const line: JournalLineImport = {
            rowIndex: i + 2,
            refNumber: refVal,
            accountName,
            description,
            debit:
              row["Debit"] !== "" && !isNaN(Number(row["Debit"]))
                ? Number(row["Debit"])
                : null,
            credit:
              row["Credit"] !== "" && !isNaN(Number(row["Credit"]))
                ? Number(row["Credit"])
                : null,
          };

          if (!grouped[curDate]) grouped[curDate] = [];
          grouped[curDate].push(line);
          totalLines++;
        });

        Object.keys(grouped).forEach((d) =>
          parsed.push({
            date: d,
            journalType: sheetName === "GJ" ? "General" : "Adjusting",
            lines: grouped[d],
          }),
        );
      });

      setAccountMappings(Object.values(temp));
      setParseResult({
        isSuccess: true,
        totalTransactionsRead: parsed.length,
        totalLinesRead: totalLines,
        transactions: parsed,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse Excel file.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleMappingChange = (
    excelRef: number,
    excelName: string,
    targetRef: number,
  ) => {
    const opt = dbAccounts.find(
      (o: any) => Number(o.referenceNumber || o.code) === Number(targetRef),
    );
    setAccountMappings((prev) =>
      prev.map((m) =>
        m.excelRef === excelRef && m.excelAccountName === excelName
          ? {
              ...m,
              mappedRef: targetRef,
              mappedAccountName: opt?.accountName || opt?.name || "",
              status: targetRef ? "REALLOCATED" : "UNMAPPED",
            }
          : m,
      ),
    );
  };

  // --- Confirm Import via Manual RTK Query Dispatch ---
  const handleConfirmImport = async () => {
    if (!parseResult) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsImporting(true);

    try {
      const customMappingsDto: AccountMappingDetailDto[] = accountMappings.map(
        (m) => ({ ...m }),
      );

      const payload = {
        journalImportRequestDto: {
          targetMonth,
          targetYear,
          customMappings: customMappingsDto,
          transactions: parseResult.transactions.map((tx) => ({
            entryDate: tx.date,
            journalType: tx.journalType,
            lines: tx.lines.map((l) => ({
              accountReferenceNumber: l.refNumber,
              accountName: l.accountName,
              description: l.description,
              debit: l.debit,
              credit: l.credit,
            })),
          })),
        },
      };

      const result = await store.dispatch(
        toolsApi.endpoints.importJournalEntries.initiate(
          payload.journalImportRequestDto,
        ),
      );

      if ("data" in result) {
        setSuccessMessage(
          `Imported ${parseResult.totalTransactionsRead} entries for ${targetMonth}/${targetYear}`,
        );
        setParseResult(null);
        setSelectedFile(null);
        setAccountMappings([]);
      } else if ("error" in result) {
        const err = result.error as any;
        setErrorMessage(
          err?.data?.message ||
            err?.message ||
            "Gagal melakukan import jurnal.",
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Gagal melakukan import jurnal.");
    } finally {
      setIsImporting(false);
    }
  };

  const unmappedCount = accountMappings.filter((m) => m.mappedRef === 0).length;

  return (
    <div className="space-y-6">
      {successMessage && (
        <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600">
          <Check size={16} />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-primary" />
                Import Journal Entries
              </CardTitle>
              <CardDescription>Upload Excel GJ/AJ sheets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar size={12} />
                  Target Period
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={String(targetMonth)}
                    onValueChange={(v) => setTargetMonth(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(targetYear)}
                    onValueChange={(v) => setTargetYear(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027, 2028].map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Excel File (.xlsx)</Label>
                <Input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => {
                    setSelectedFile(e.target.files?.[0] || null);
                    setParseResult(null);
                    setAccountMappings([]);
                  }}
                />
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 gap-1"
                  onClick={() =>
                    window.open("/tools/download-journal-template", "_blank")
                  }
                >
                  <Download size={12} />
                  Download Template
                </Button>
              </div>

              <div className="grid gap-2">
                <Button
                  disabled={!selectedFile || isBusy}
                  onClick={handlePreview}
                  className="gap-2"
                >
                  <Eye size={14} />
                  {isBusy ? "Processing..." : "Preview Entries"}
                </Button>
                {parseResult && (
                  <Button
                    disabled={isBusy || unmappedCount > 0}
                    onClick={handleConfirmImport}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-500"
                  >
                    <Check size={14} />
                    Submit & Import ({parseResult.totalTransactionsRead})
                  </Button>
                )}
                {unmappedCount > 0 && (
                  <p className="text-caption text-destructive text-center font-medium">
                    {unmappedCount} akun belum dipetakan
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {accountMappings.length > 0 && (
            <Card>
              <CardHeader className="py-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-caption">Mapping Status</CardTitle>
                <Badge variant="secondary">{accountMappings.length} akun</Badge>
              </CardHeader>
              <CardContent className="p-0 max-h-60 overflow-auto">
                <MappingStatusTable
                  mappings={accountMappings}
                  dbAccounts={dbAccounts}
                  isLoadingCoa={isLoadingCoa}
                  onMappingChange={handleMappingChange}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-8 space-y-4">
          {parseResult ? (
            <div className="space-y-4 max-h-[calc(100vh-120px)] overflow-auto pr-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Upload size={14} />
                  Preview Transactions
                </h3>
                <Badge>{parseResult.transactions.length} loaded</Badge>
              </div>
              {parseResult.transactions.map((tx, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <CardHeader className="py-2 px-3 flex-row items-center justify-between space-y-0 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Badge>{tx.journalType}</Badge>
                      <Badge variant="outline" className="font-mono">
                        {tx.date}
                      </Badge>
                    </div>
                    <span className="text-caption text-muted-foreground">
                      {tx.lines.length} lines
                    </span>
                  </CardHeader>
                  <CardContent className="p-0">
                    <PreviewTransactionLinesTable
                      lines={tx.lines}
                      accountMappings={accountMappings}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="h-64 grid place-items-center border-dashed">
              <CardContent className="text-center text-muted-foreground">
                <Upload size={32} className="mx-auto mb-2 opacity-50" />
                <p className="font-medium">No Preview Yet</p>
                <p className="text-caption">
                  Select Excel on left and click Preview
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
