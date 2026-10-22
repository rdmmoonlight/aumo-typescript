"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatNumber } from "../_lib/format";
import { TrialRow } from "../_lib/types";

const columnHelper = createColumnHelper<TrialRow>();

export function TrialTable({
  rows,
  totalDebit,
  totalCredit,
}: {
  rows: TrialRow[];
  totalDebit: number;
  totalCredit: number;
}) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("referenceNumber", {
        header: () => <div className="text-center text-caption">Ref.</div>,
        cell: (info) => (
          <div className="text-center">
            <Badge
              variant="outline"
              className="font-mono text-amber-500 text-label-small"
            >
              {info.getValue() || "-"}
            </Badge>
          </div>
        ),
      }),
      columnHelper.accessor("accountName", {
        header: "Account",
        cell: (info) => (
          <span className="text-caption font-medium">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: (info) => (
          <Badge variant="secondary" className="text-label-small">
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("debit", {
        header: () => <div className="text-right text-caption">Debit</div>,
        cell: (info) => (
          <div className="font-mono text-caption text-emerald-500 text-right">
            {info.getValue()! > 0 ? formatNumber(info.getValue()!) : "-"}
          </div>
        ),
      }),
      columnHelper.accessor("credit", {
        header: () => <div className="text-right text-caption">Credit</div>,
        cell: (info) => (
          <div className="font-mono text-caption text-red-500 text-right">
            {info.getValue()! > 0 ? formatNumber(info.getValue()!) : "-"}
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) =>
      String(row.accountId || `${row.type}-${row.accountName}`),
  });

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className={`text-caption ${h.id === "referenceNumber" ? "w-[10%] pl-6 text-center" : ""} ${h.id === "accountName" ? "w-[50%]" : ""} ${h.id === "type" ? "w-[15%]" : ""} ${h.id === "debit" ? "w-[12%] text-right" : ""} ${h.id === "credit" ? "w-[13%] pr-6 text-right" : ""}`}
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`${cell.column.id === "referenceNumber" ? "pl-6" : ""} ${cell.column.id === "credit" ? "pr-6" : ""}`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-caption text-muted-foreground"
                >
                  No accounts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow className="font-bold text-caption">
              <TableCell colSpan={3} className="pl-6 text-right">
                Total
              </TableCell>
              <TableCell className="font-mono text-emerald-500 text-right">
                {formatNumber(totalDebit)}
              </TableCell>
              <TableCell className="pr-6 font-mono text-red-500 text-right">
                {formatNumber(totalCredit)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
