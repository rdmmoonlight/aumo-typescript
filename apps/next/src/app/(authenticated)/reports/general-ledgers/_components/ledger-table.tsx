"use client";
import {
  Table,
  TableBody,
  TableCell,
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
import { formatNumber } from "../_lib/format";
import { LedgerLine } from "../_lib/types";

const columnHelper = createColumnHelper<LedgerLine>();

export function LedgerTable({ lines }: { lines: LedgerLine[] }) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("entryDate", {
        header: () => (
          <span className="text- font-semibold uppercase tracking-wider text-muted-foreground">
            Date
          </span>
        ),
        cell: (info) => (
          <span className="text-xs text-muted-foreground">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("description", {
        header: () => (
          <span className="text- font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </span>
        ),
        cell: (info) => (
          <span className="text-xs text-muted-foreground">
            {info.getValue() || "-"}
          </span>
        ),
      }),
      columnHelper.accessor("debit", {
        header: () => (
          <div className="text-right text- font-semibold uppercase tracking-wider text-muted-foreground">
            Debit
          </div>
        ),
        cell: (info) => (
          <span className="font-mono text-xs text-emerald-500">
            {info.getValue() > 0 ? formatNumber(info.getValue()) : "-"}
          </span>
        ),
      }),
      columnHelper.accessor("credit", {
        header: () => (
          <div className="text-right text- font-semibold uppercase tracking-wider text-muted-foreground">
            Credit
          </div>
        ),
        cell: (info) => (
          <span className="font-mono text-xs text-red-500">
            {info.getValue() > 0 ? formatNumber(info.getValue()) : "-"}
          </span>
        ),
      }),
      columnHelper.accessor("runningBalance", {
        header: () => (
          <div className="text-right text- font-semibold uppercase tracking-wider text-muted-foreground">
            Balance
          </div>
        ),
        cell: (info) => (
          <span className="font-mono text-xs font-medium">
            {formatNumber(info.getValue())}
          </span>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: lines || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!lines?.length) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center py-6 text-xs text-muted-foreground"
            >
              No postings
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id}>
            {hg.headers.map((h) => (
              <TableHead
                key={h.id}
                className={`${["debit", "credit", "runningBalance"].includes(h.id) ? "text-right" : ""} ${h.id === "entryDate" ? "pl-6" : ""} ${h.id === "runningBalance" ? "pr-6" : ""}`}
              >
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
              <TableCell
                key={cell.id}
                className={`${["debit", "credit", "runningBalance"].includes(cell.column.id) ? "text-right" : ""} ${cell.column.id === "entryDate" ? "pl-6" : ""} ${cell.column.id === "runningBalance" ? "pr-6" : ""}`}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
