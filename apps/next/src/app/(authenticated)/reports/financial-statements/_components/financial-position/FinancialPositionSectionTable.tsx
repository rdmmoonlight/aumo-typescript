"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { FinancialPositionLine } from "../../_types";

const columnHelper = createColumnHelper<FinancialPositionLine>();

export function FinancialPositionSectionTable({
  title,
  lines,
  totalAmount,
  totalLabel,
  emptyMessage,
  totalColorClass = "",
}: any) {
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
      columnHelper.accessor("accountName", {
        header: () => <div className="text-caption">Account</div>,
        cell: (i) => (
          <span className="text-ui font-medium">{i.getValue() || "-"}</span>
        ),
      }),
      columnHelper.accessor("amount", {
        header: () => <div className="text-right text-caption">Amount</div>,
        cell: (i) => (
          <div className="text-right font-mono text-caption">
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
    <Card className="overflow-hidden">
      <CardHeader className="py-3 bg-muted/30 border-b">
        <CardTitle className="tracking-widest uppercase text-amber-500 text-caption">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {lines.length === 0 ? (
          <div className="p-4 text-caption text-muted-foreground italic">
            {emptyMessage}
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
                      className={`p-3 px-4 ${c.column.id === "referenceNumber" ? "w-[15%]" : ""} ${c.column.id === "amount" ? "w-[30%]" : ""}`}
                    >
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="bg-transparent border-t">
              <TableRow className="font-semibold text-ui hover:bg-transparent">
                <TableCell colSpan={2} className="p-4">
                  {totalLabel}
                </TableCell>
                <TableCell
                  className={`p-4 text-right font-mono ${totalColorClass}`}
                >
                  {formatNumber(totalAmount)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
