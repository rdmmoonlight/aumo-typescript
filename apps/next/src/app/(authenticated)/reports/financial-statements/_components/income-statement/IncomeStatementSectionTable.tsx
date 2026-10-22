"use client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { formatNumber } from "../../_lib/formatters";
import { IncomeStatementLine } from "../../_types";

const columnHelper = createColumnHelper<IncomeStatementLine>();

export function IncomeStatementSectionTable({
  title,
  lines,
  totalLabel,
  total,
  variant = "default",
}: {
  title: string;
  lines: IncomeStatementLine[];
  totalLabel: string;
  total: number;
  variant?: "default" | "gross" | "net";
}) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("referenceNumber", {
        header: () => <div className="text-caption">Ref</div>,
        cell: (i) =>
          i.getValue() ? (
            <Badge variant="outline" className="font-mono text-label-small">
              {i.getValue() as any}
            </Badge>
          ) : null,
      }),
      columnHelper.accessor((row) => row.accountName || row.description, {
        id: "accountName",
        header: () => <div className="text-caption">Account</div>,
        cell: (i) => (
          <span className="text-ui font-medium">{i.getValue() || "-"}</span>
        ),
      }),
      columnHelper.accessor("amount", {
        header: () => <div className="text-right text-caption">Amount</div>,
        cell: (i) => (
          <div
            className={`text-right font-mono text-caption ${Number(i.getValue()) < 0 ? "text-red-500" : ""}`}
          >
            {formatNumber(Number(i.getValue()) || 0)}
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: lines,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-2">
      <div className="text-caption font-bold tracking-widest text-amber-500 uppercase">
        {title}
      </div>
      {lines.length === 0 ? (
        <div className="p-4 text-caption text-muted-foreground italic">
          No {title.toLowerCase()}.
        </div>
      ) : (
        <Table>
          <TableHeader className="sr-only">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((r) => (
              <TableRow key={r.id}>
                {r.getVisibleCells().map((c) => (
                  <TableCell
                    key={c.id}
                    className={`p-3 ${c.column.id === "referenceNumber" ? "w-[15%]" : ""} ${c.column.id === "amount" ? "w-[30%] text-right" : ""}`}
                  >
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter
            className={`${variant === "net" ? "bg-primary/10" : "bg-transparent"} border-t`}
          >
            <TableRow className="font-semibold text-ui hover:bg-transparent">
              <TableCell colSpan={2} className="p-4">
                {totalLabel}
              </TableCell>
              <TableCell
                className={`p-4 text-right font-mono ${variant === "net" ? "text-emerald-600 font-bold" : variant === "gross" ? "text-sky-600" : ""}`}
              >
                {formatNumber(total)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )}
    </div>
  );
}
