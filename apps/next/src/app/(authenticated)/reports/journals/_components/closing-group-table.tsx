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
import { formatNumberWithParen } from "../_lib/format";
import { ClosingJournalEntryGroup, ClosingJournalLine } from "../_lib/types";

const helper = createColumnHelper<ClosingJournalLine>();

export function ClosingGroupTable({
  group,
  totals,
}: {
  group: ClosingJournalEntryGroup;
  totals: { totalDebit: number; totalCredit: number };
}) {
  const columns = useMemo(
    () => [
      helper.accessor("referenceNumber", {
        header: () => <div className="text-center text-caption">Ref.</div>,
        cell: (info) => (
          <div className="text-center pl-6">
            <Badge
              variant="outline"
              className="font-mono text-amber-500 text-label-small"
            >
              {info.getValue() || "-"}
            </Badge>
          </div>
        ),
      }),
      helper.accessor("accountName", {
        header: "Account",
        cell: ({ row }) => (
          <div
            className={`text-caption ${row.original.credit > 0 ? "pl-6 text-muted-foreground" : "font-medium"}`}
          >
            {row.original.accountName}
          </div>
        ),
      }),
      helper.accessor("debit", {
        header: () => <div className="text-right text-caption">Debit</div>,
        cell: (info) => (
          <div className="text-right font-mono text-caption text-emerald-500">
            {info.getValue() > 0 ? formatNumberWithParen(info.getValue()) : "-"}
          </div>
        ),
      }),
      helper.accessor("credit", {
        header: () => (
          <div className="text-right pr-6 text-caption">Credit</div>
        ),
        cell: (info) => (
          <div className="text-right pr-6 font-mono text-caption text-red-500">
            {info.getValue() > 0 ? formatNumberWithParen(info.getValue()) : "-"}
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: group.lines || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="py-3 bg-muted/30 border-b">
        <CardTitle className="text-ui">{group.description}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="min-w-">
          <TableHeader>
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
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-bold">
              <TableCell colSpan={2} className="text-right">
                Total
              </TableCell>
              <TableCell className="text-right font-mono text-emerald-500">
                {formatNumberWithParen(totals.totalDebit)}
              </TableCell>
              <TableCell className="text-right pr-6 font-mono text-red-500">
                {formatNumberWithParen(totals.totalCredit)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
