"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { store } from "@/lib/store";
import {
  reportsApi,
  SummaryResponse,
} from "@/lib/store/(authenticated)/reports/reportsApi";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Activity,
  ArrowRight,
  Banknote,
  BarChart2,
  BarChart3,
  Book,
  BookOpen,
  Building2,
  CalendarCheck2,
  ClipboardList,
  Coins,
  FileCheck,
  FileSpreadsheet,
  Layers,
  Library,
  Receipt,
  Search,
  Table as TableIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ReportItem = {
  href: string;
  title: string;
  desc: string;
  category: string;
  step: string;
  icon: React.ElementType;
};

const REPORTS: ReportItem[] = [
  // --- JOURNALS & LEDGERS ---
  {
    href: "/reports/journals/general",
    title: "General Journal",
    desc: "Buku harian semua transaksi",
    category: "Journals & Ledgers",
    step: "01",
    icon: Receipt,
  },
  {
    href: "/reports/general-ledgers/permanent",
    title: "General Ledger - Permanent",
    desc: "Buku besar akun riil",
    category: "Journals & Ledgers",
    step: "02",
    icon: Library,
  },
  {
    href: "/reports/general-ledgers/temporary",
    title: "General Ledger - Temporary",
    desc: "Buku besar akun nominal",
    category: "Journals & Ledgers",
    step: "03",
    icon: Book,
  },

  // --- TRIAL BALANCE CYCLE ---
  {
    href: "/reports/trial-balances/unadjusted",
    title: "Unadjusted Trial Balance",
    desc: "Neraca saldo awal sebelum penyesuaian",
    category: "Trial Balance Cycle",
    step: "04",
    icon: ClipboardList,
  },
  {
    href: "/reports/worksheet",
    title: "Worksheet",
    desc: "10-column worksheet & kertas kerja",
    category: "Trial Balance Cycle",
    step: "05",
    icon: TableIcon,
  },
  {
    href: "/reports/journals/adjusting",
    title: "Adjusting Journal",
    desc: "Jurnal penyesuaian akhir periode",
    category: "Trial Balance Cycle",
    step: "06",
    icon: BookOpen,
  },
  {
    href: "/reports/trial-balances/adjusted",
    title: "Adjusted Trial Balance",
    desc: "Neraca saldo setelah penyesuaian",
    category: "Trial Balance Cycle",
    step: "07",
    icon: FileCheck,
  },

  // --- FINANCIAL STATEMENTS ---
  {
    href: "/reports/financial-statements/income-statement",
    title: "Income Statement",
    desc: "Laporan laba rugi periode berjalan",
    category: "Financial Statements",
    step: "08",
    icon: BarChart3,
  },
  {
    href: "/reports/financial-statements/retained-earnings",
    title: "Retained Earnings",
    desc: "Laporan perubahan modal & laba ditahan",
    category: "Financial Statements",
    step: "09",
    icon: Coins,
  },
  {
    href: "/reports/financial-statements/statement-of-financial-position",
    title: "Financial Position",
    desc: "Neraca / Statement of Financial Position",
    category: "Financial Statements",
    step: "10",
    icon: Building2,
  },
  {
    href: "/reports/financial-statements/statement-of-cash-flow",
    title: "Cash Flow Statement",
    desc: "Arus kas operasi, investasi, pendanaan",
    category: "Financial Statements",
    step: "11",
    icon: Banknote,
  },

  // --- CLOSING CYCLE ---
  {
    href: "/reports/journals/closing",
    title: "Closing Journal",
    desc: "Jurnal penutup akun nominal",
    category: "Closing Cycle",
    step: "12",
    icon: BookOpen,
  },
  {
    href: "/reports/trial-balances/post-closing",
    title: "Post-Closing Trial Balance",
    desc: "Neraca saldo setelah penutupan",
    category: "Closing Cycle",
    step: "13",
    icon: FileSpreadsheet,
  },
];

const CATEGORIES = [
  {
    id: "Journals & Ledgers",
    label: "Journals & Ledgers",
    hint: "Pencatatan harian & buku besar",
  },
  {
    id: "Trial Balance Cycle",
    label: "Trial Balance & Worksheet",
    hint: "Tahap awal hingga penyesuaian",
  },
  {
    id: "Financial Statements",
    label: "Financial Statements",
    hint: "Output utama laporan keuangan",
  },
  {
    id: "Closing Cycle",
    label: "Closing Cycle",
    hint: "Penutupan & saldo awal periode baru",
  },
];

const columnHelper = createColumnHelper<ReportItem>();

export default function ReportsPage() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchSummary() {
      try {
        setSummaryLoading(true);
        setIsError(false);

        const result = await store.dispatch(
          reportsApi.endpoints.getSummary.initiate(),
        );

        if (isMounted) {
          if ("data" in result && result.data) {
            setSummaryData(result.data);
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
          setSummaryLoading(false);
        }
      }
    }

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = (summaryData as any)?.data ?? summaryData;

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Report Card",
        cell: (info) => {
          const report = info.row.original;
          const Icon = report.icon;
          return (
            <Link
              href={report.href}
              className="group relative flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-4 transition-all hover:border-indigo-500/30 hover:bg-white/[0.06]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-white/80 group-hover:border-indigo-400/30 group-hover:text-white">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-white">
                    {report.title}
                  </span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white/40">
                    {report.step}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-white/50">
                  {report.desc}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-white/30 group-hover:text-indigo-300">
                  <span>{report.href}</span>
                  <ArrowRight className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </div>
              </div>
            </Link>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: REPORTS,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _, filterValue) => {
      const search = filterValue.toLowerCase();
      const { title, desc, href } = row.original;
      return `${title} ${desc} ${href}`.toLowerCase().includes(search);
    },
  });

  const filteredRows = table.getFilteredRowModel().rows;

  return (
    <div className="grid w-full place-items-center py-6">
      <Card className="w-full max-w-5xl rounded-2xl border border-white/10 bg-[#0F172A] p-6 text-white shadow-2xl">
        <CardContent className="p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-300/20 bg-gradient-to-br from-indigo-500/80 to-violet-600/80 shadow-lg">
                <BarChart2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Reports Center
                </h1>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/60">
                  Akses 13 laporan siklus akuntansi lengkap.
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-white/10 bg-white/5 text-white/60"
            >
              {REPORTS.length} REPORTS
            </Badge>
          </div>

          {/* SUMMARY DARI CONTROLLER VIA STORE DISPATCH */}
          <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-transparent to-violet-500/20 opacity-60" />
            <div className="relative grid grid-cols-1 divide-y divide-white/10 bg-[#0B1226]/90 backdrop-blur md:grid-cols-3 md:divide-x md:divide-y-0">
              <div className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/15 text-indigo-300">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/40">
                    Total Journal
                  </p>
                  {summaryLoading ? (
                    <div className="mt-1 h-6 w-16 animate-pulse rounded bg-white/10" />
                  ) : (
                    <p className="text-2xl font-bold tabular-nums text-white">
                      {isError ? "-" : (summary?.totalJournal ?? 0)}
                    </p>
                  )}
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-white/40">
                    <Activity className="h-3 w-3" /> entri tercatat
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/15 text-violet-300">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/40">
                    Active COA
                  </p>
                  {summaryLoading ? (
                    <div className="mt-1 h-6 w-16 animate-pulse rounded bg-white/10" />
                  ) : (
                    <p className="text-2xl font-bold tabular-nums text-white">
                      {isError ? "-" : (summary?.activeCoa ?? 0)}
                    </p>
                  )}
                  <p className="text-xs text-white/40">akun aktif</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70">
                  <CalendarCheck2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-widest text-white/40">
                    Selected Period
                  </p>
                  {summaryLoading ? (
                    <div className="mt-1 h-6 w-32 animate-pulse rounded bg-white/10" />
                  ) : (
                    <p className="truncate text-sm font-semibold text-white">
                      {isError ? "Gagal load" : summary?.activePeriodName}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    {!summaryLoading && (
                      <>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            summary?.isPeriodOpen
                              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse"
                              : "bg-amber-400"
                          }`}
                        />
                        <span
                          className={`text-xs ${
                            summary?.isPeriodOpen
                              ? "text-emerald-300"
                              : "text-amber-300/80"
                          }`}
                        >
                          {summary?.isPeriodOpen ? "Open" : "Closed"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Cari laporan: journal, ledger, cash flow..."
              className="h-11 rounded-xl border-white/10 bg-black/40 pl-10 text-sm text-white placeholder:text-white/30 focus-visible:ring-indigo-500/50"
            />
          </div>

          <Separator className="my-6 bg-white/10" />
          <div className="space-y-8">
            {CATEGORIES.map((cat) => {
              const categoryRows = filteredRows.filter(
                (row) => row.original.category === cat.id,
              );
              if (categoryRows.length === 0) return null;
              return (
                <div key={cat.id}>
                  <div className="mb-3 flex items-baseline justify-between">
                    <h2 className="text-sm font-semibold tracking-wide text-white/90">
                      {cat.label}
                    </h2>
                    <span className="text-xs text-white/40">{cat.hint}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {categoryRows.map((row) => (
                      <div key={row.id}>
                        {flexRender(
                          row.getVisibleCells()[0].column.columnDef.cell,
                          row.getVisibleCells()[0].getContext(),
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
