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
import { WorksheetRow, WorksheetTotals } from "./types";
import { formatNumber } from "./utils";

const columnHelper = createColumnHelper<WorksheetRow>();

export function WorksheetTable({
  rows,
  totals,
  netIncome,
}: {
  rows: WorksheetRow[];
  totals: WorksheetTotals;
  netIncome: number;
}) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("accountName", {
        id: "accountName",
        header: "Account",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-caption">
            <Badge variant="outline" className="font-mono text-label-small">
              {row.original.referenceNumber}
            </Badge>
            <span className="text-caption">{row.original.accountName}</span>
          </div>
        ),
      }),
      columnHelper.accessor("unadjustedDebit", {
        id: "unadjustedDebit",
        header: "Dr",
        cell: (i) => (i.getValue() ? formatNumber(i.getValue()) : "-"),
      }),
      columnHelper.accessor("unadjustedCredit", {
        id: "unadjustedCredit",
        header: "Cr",
        cell: (i) => (i.getValue() ? formatNumber(i.getValue()) : "-"),
      }),
      columnHelper.accessor("adjustmentDebit", {
        id: "adjustmentDebit",
        header: "Dr",
        cell: (i) => (i.getValue() ? formatNumber(i.getValue()) : "-"),
      }),
      columnHelper.accessor("adjustmentCredit", {
        id: "adjustmentCredit",
        header: "Cr",
        cell: (i) => (i.getValue() ? formatNumber(i.getValue()) : "-"),
      }),
      columnHelper.accessor("adjustedDebit", {
        id: "adjustedDebit",
        header: "Dr",
        cell: (i) => (i.getValue() ? formatNumber(i.getValue()) : "-"),
      }),
      columnHelper.accessor("adjustedCredit", {
        id: "adjustedCredit",
        header: "Cr",
        cell: (i) => (i.getValue() ? formatNumber(i.getValue()) : "-"),
      }),
      columnHelper.accessor("incomeStatementDebit", {
        id: "incomeStatementDebit",
        header: "Dr",
        cell: (i) => (i.getValue() ? formatNumber(i.getValue()) : "-"),
      }),
      columnHelper.accessor("incomeStatementCredit", {
        id: "incomeStatementCredit",
        header: "Cr",
        cell: (i) => (i.getValue() ? formatNumber(i.getValue()) : "-"),
      }),
      columnHelper.accessor("financialPositionDebit", {
        id: "financialPositionDebit",
        header: "Dr",
        cell: (i) => (i.getValue() ? formatNumber(i.getValue()) : "-"),
      }),
      columnHelper.accessor("financialPositionCredit", {
        id: "financialPositionCredit",
        header: "Cr",
        cell: (i) => (i.getValue() ? formatNumber(i.getValue()) : "-"),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.accountId),
  });

  return (
    <Table className="text-caption">
      <TableHeader>
        <TableRow className="bg-muted/50 text-caption">
          <TableHead
            rowSpan={2}
            className="sticky left-0 bg-muted/50 z-10 min-w- text-caption"
          >
            Account
          </TableHead>
          <TableHead colSpan={2} className="text-center border-l text-caption">
            Trial Balance
          </TableHead>
          <TableHead colSpan={2} className="text-center border-l text-caption">
            Adjustments
          </TableHead>
          <TableHead colSpan={2} className="text-center border-l text-caption">
            Adjusted TB
          </TableHead>
          <TableHead colSpan={2} className="text-center border-l text-caption">
            Income Statement
          </TableHead>
          <TableHead colSpan={2} className="text-center border-l text-caption">
            Balance Sheet
          </TableHead>
        </TableRow>
        <TableRow className="bg-muted/50 text-caption">
          <TableHead className="text-right">Dr</TableHead>
          <TableHead className="text-right">Cr</TableHead>
          <TableHead className="text-right border-l">Dr</TableHead>
          <TableHead className="text-right">Cr</TableHead>
          <TableHead className="text-right border-l">Dr</TableHead>
          <TableHead className="text-right">Cr</TableHead>
          <TableHead className="text-right border-l">Dr</TableHead>
          <TableHead className="text-right">Cr</TableHead>
          <TableHead className="text-right border-l">Dr</TableHead>
          <TableHead className="text-right">Cr</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const id = cell.column.id;
                if (id === "accountName") {
                  return (
                    <TableCell
                      key={cell.id}
                      className="sticky left-0 bg-background font-medium flex items-center gap-2"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  );
                }
                const isAmber =
                  id === "adjustmentDebit" || id === "adjustmentCredit";
                const isEmerald =
                  id === "incomeStatementDebit" ||
                  id === "incomeStatementCredit";
                const isSky =
                  id === "financialPositionDebit" ||
                  id === "financialPositionCredit";
                const isBorderLeft = [
                  "adjustmentDebit",
                  "adjustedDebit",
                  "incomeStatementDebit",
                  "financialPositionDebit",
                ].includes(id);
                return (
                  <TableCell
                    key={cell.id}
                    className={`text-right font-mono ${isBorderLeft ? "border-l" : ""} ${isAmber ? "text-amber-500" : ""} ${isEmerald ? "text-emerald-500" : ""} ${isSky ? "text-sky-500" : ""}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={11}
              className="text-center py-6 text-muted-foreground"
            >
              No worksheet rows.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
      <TableFooter className="font-bold">
        <TableRow>
          <TableCell className="sticky left-0 bg-muted text-right">
            Total
          </TableCell>
          <TableCell className="text-right font-mono">
            {formatNumber(totals.unadjustedDebit)}
          </TableCell>
          <TableCell className="text-right font-mono">
            {formatNumber(totals.unadjustedCredit)}
          </TableCell>
          <TableCell className="text-right font-mono text-amber-500 border-l">
            {formatNumber(totals.adjustmentDebit)}
          </TableCell>
          <TableCell className="text-right font-mono text-amber-500">
            {formatNumber(totals.adjustmentCredit)}
          </TableCell>
          <TableCell className="text-right font-mono border-l">
            {formatNumber(totals.adjustedDebit)}
          </TableCell>
          <TableCell className="text-right font-mono">
            {formatNumber(totals.adjustedCredit)}
          </TableCell>
          <TableCell className="text-right font-mono text-emerald-500 border-l">
            {formatNumber(totals.isDebit)}
          </TableCell>
          <TableCell className="text-right font-mono text-emerald-500">
            {formatNumber(totals.isCredit)}
          </TableCell>
          <TableCell className="text-right font-mono text-sky-500 border-l">
            {formatNumber(totals.bsDebit)}
          </TableCell>
          <TableCell className="text-right font-mono text-sky-500">
            {formatNumber(totals.bsCredit)}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={7} className="sticky left-0 bg-muted text-right">
            Net Income (plug)
          </TableCell>
          <TableCell className="text-right font-mono text-emerald-500 border-l">
            {netIncome >= 0 ? formatNumber(netIncome) : "-"}
          </TableCell>
          <TableCell className="text-right font-mono text-emerald-500">
            {netIncome < 0 ? formatNumber(Math.abs(netIncome)) : "-"}
          </TableCell>
          <TableCell className="text-right font-mono text-sky-500 border-l">
            {netIncome < 0 ? formatNumber(Math.abs(netIncome)) : "-"}
          </TableCell>
          <TableCell className="text-right font-mono text-sky-500">
            {netIncome >= 0 ? formatNumber(netIncome) : "-"}
          </TableCell>
        </TableRow>
        <TableRow className="bg-primary/5">
          <TableCell
            colSpan={7}
            className="sticky left-0 bg-primary/5 text-right"
          >
            Total (after plug)
          </TableCell>
          <TableCell className="text-right font-mono text-emerald-500 border-l">
            {formatNumber(totals.isDebit + (netIncome >= 0 ? netIncome : 0))}
          </TableCell>
          <TableCell className="text-right font-mono text-emerald-500">
            {formatNumber(
              totals.isCredit + (netIncome < 0 ? Math.abs(netIncome) : 0),
            )}
          </TableCell>
          <TableCell className="text-right font-mono text-sky-500 border-l">
            {formatNumber(
              totals.bsDebit + (netIncome < 0 ? Math.abs(netIncome) : 0),
            )}
          </TableCell>
          <TableCell className="text-right font-mono text-sky-500">
            {formatNumber(totals.bsCredit + (netIncome >= 0 ? netIncome : 0))}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
