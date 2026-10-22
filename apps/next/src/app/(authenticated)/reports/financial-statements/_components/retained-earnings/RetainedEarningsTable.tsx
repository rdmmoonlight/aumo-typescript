"use client";
import { formatNumber } from "@/app/(authenticated)/reports/financial-statements/_lib/formatters";
import { StatementRow } from "@/app/(authenticated)/reports/financial-statements/_types";
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

const columnHelper = createColumnHelper<StatementRow>();

export function RetainedEarningsTable({ data }: { data: StatementRow[] }) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("label", {
        header: "Keterangan",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <span
              className={`${item.isIndent ? "pl-8 text-muted-foreground text-caption" : ""} ${item.isTotal ? "font-bold text-body" : "font-medium text-ui"}`}
            >
              {item.label}
            </span>
          );
        },
      }),
      columnHelper.accessor("amount", {
        header: () => (
          <div className="text-right pr-4 text-caption">Jumlah (IDR)</div>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div
              className={`text-right pr-4 font-mono font-medium text-ui ${item.isTotal ? "text-emerald-500 font-bold text-body" : ""} ${item.valueColorClass || ""}`}
            >
              {item.isNegativeFormat
                ? `(${formatNumber(item.amount)})`
                : formatNumber(item.amount)}
            </div>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
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
        {table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            className={
              row.original.isTotal
                ? "bg-primary/5 border-t-2 hover:bg-primary/5"
                : "hover:bg-transparent"
            }
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                className={`p-4 ${cell.column.id === "label" ? "w-[65%]" : "w-[35%]"}`}
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
