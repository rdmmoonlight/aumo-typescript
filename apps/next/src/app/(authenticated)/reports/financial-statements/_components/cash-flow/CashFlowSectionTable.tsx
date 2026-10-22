"use client";
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
import { CashFlowLine } from "../../_types";

const columnHelper = createColumnHelper<CashFlowLine>();

export function CashFlowSectionTable({
  title,
  lines,
  totalLabel,
  total,
}: {
  title: string;
  lines: CashFlowLine[];
  totalLabel: string;
  total: number;
}) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("description", {
        header: "Deskripsi",
        cell: (i) => (
          <span className="text-ui font-medium pl-4">{i.getValue()}</span>
        ),
      }),
      columnHelper.accessor("amount", {
        header: () => (
          <div className="text-right pr-4 text-caption">Jumlah</div>
        ),
        cell: (i) => (
          <div
            className={`text-right pr-4 font-mono text-caption ${(i.getValue() || 0) < 0 ? "text-red-500" : "text-emerald-500"}`}
          >
            {formatNumber(i.getValue() || 0)}
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
        <div className="text-caption text-muted-foreground italic pl-4 py-2">
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
              <TableRow key={r.id} className="border-none hover:bg-transparent">
                {r.getVisibleCells().map((c) => (
                  <TableCell
                    key={c.id}
                    className={`py-1 ${c.column.id === "description" ? "w-[75%]" : "w-[25%]"}`}
                  >
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent border-t">
            <TableRow className="font-semibold text-ui hover:bg-transparent">
              <TableCell className="pl-4 py-2">{totalLabel}</TableCell>
              <TableCell
                className={`text-right pr-4 py-2 font-mono ${total < 0 ? "text-red-500" : "text-emerald-500"}`}
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
