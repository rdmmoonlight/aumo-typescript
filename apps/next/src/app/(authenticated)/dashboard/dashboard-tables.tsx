"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";

export interface AccountBalanceItem {
  accountId: number;
  referenceNumber: string;
  accountName: string;
  balance: number;
}
export interface TrendItem {
  label: string;
  revenue: number;
  expense: number;
  net: number;
}

export const formatNumber = (amount: number) => {
  const isNeg = amount < 0;
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return isNeg ? `(${formatted})` : formatted;
};

const expenseColumnHelper = createColumnHelper<AccountBalanceItem>();
const trendColumnHelper = createColumnHelper<TrendItem>();

export function ExpenseTable({ data }: { data: AccountBalanceItem[] }) {
  const columns = useMemo(
    () => [
      expenseColumnHelper.accessor("referenceNumber", {
        header: "Ref No.",
        cell: (info) => (
          <span className="font-mono text-caption text-muted-foreground">
            {info.getValue() || "---"}
          </span>
        ),
      }),
      expenseColumnHelper.accessor("accountName", {
        header: "Account Name",
        cell: (info) => (
          <span className="font-medium text-caption">{info.getValue()}</span>
        ),
      }),
      expenseColumnHelper.accessor("balance", {
        header: () => <div className="text-right">Balance (IDR)</div>,
        cell: (info) => (
          <div className="text-right font-mono text-caption font-semibold text-red-500">
            {formatNumber(info.getValue())}
          </div>
        ),
      }),
    ],
    [],
  );
  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!data?.length)
    return (
      <div className="py-8 text-center text-caption text-muted-foreground">
        No expenses recorded for this period.
      </div>
    );

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id}>
            {hg.headers.map((h) => (
              <TableHead key={h.id} className="text-caption h-8">
                {h.isPlaceholder
                  ? null
                  : flexRender(h.column.columnDef.header, h.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className="py-2">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function TrendTable({ data }: { data: TrendItem[] }) {
  const columns = useMemo(
    () => [
      trendColumnHelper.accessor("label", {
        header: "Period",
        cell: (i) => (
          <span className="font-semibold text-caption">{i.getValue()}</span>
        ),
      }),
      trendColumnHelper.accessor("revenue", {
        header: () => <div className="text-right">Revenue</div>,
        cell: (i) => (
          <div className="text-right font-mono text-caption text-emerald-500">
            {formatNumber(i.getValue())}
          </div>
        ),
      }),
      trendColumnHelper.accessor("expense", {
        header: () => <div className="text-right">Expenses</div>,
        cell: (i) => (
          <div className="text-right font-mono text-caption text-red-500">
            {formatNumber(i.getValue())}
          </div>
        ),
      }),
      trendColumnHelper.accessor("net", {
        header: () => <div className="text-right">Net Income</div>,
        cell: (i) => {
          const v = i.getValue();
          return (
            <div
              className={cn(
                "text-right font-mono text-caption font-semibold",
                v >= 0 ? "text-emerald-600" : "text-red-600",
              )}
            >
              {formatNumber(v)}
            </div>
          );
        },
      }),
    ],
    [],
  );
  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  if (!data?.length)
    return (
      <div className="py-8 text-center text-caption text-muted-foreground">
        No trend data available.
      </div>
    );
  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id}>
            {hg.headers.map((h) => (
              <TableHead key={h.id} className="text-caption h-8">
                {h.isPlaceholder
                  ? null
                  : flexRender(h.column.columnDef.header, h.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className="py-2">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
