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
import { formatIDR } from "./constants";
import { AccountMappingDetail, JournalLineImport } from "./types";

const helper = createColumnHelper<JournalLineImport>();

export function PreviewTransactionLinesTable({
  lines,
  accountMappings,
}: {
  lines: JournalLineImport[];
  accountMappings: AccountMappingDetail[];
}) {
  const columns = useMemo(
    () => [
      helper.accessor("rowIndex", {
        header: "#",
        cell: (i) => <span className="text-caption">{i.getValue()}</span>,
      }),
      helper.accessor("refNumber", {
        header: "Ref",
        cell: (i) => (
          <Badge variant="secondary" className="font-mono text-label-small">
            {i.getValue()}
          </Badge>
        ),
      }),
      helper.accessor("accountName", {
        header: "Account",
        cell: ({ row }) => {
          const line = row.original;
          const mapping = accountMappings.find(
            (m) =>
              m.excelRef === line.refNumber &&
              m.excelAccountName === line.accountName,
          );
          return (
            <div className="text-caption">
              <div className="font-medium">{line.accountName}</div>
              <div className="text-caption text-muted-foreground truncate">
                {line.description}
              </div>
              {mapping?.mappedRef ? (
                <Badge className="mt-1 bg-amber-500/15 text-amber-600 border-amber-500/20 text-label-small">
                  → [{mapping.mappedRef}] {mapping.mappedAccountName}
                </Badge>
              ) : (
                <Badge variant="destructive" className="mt-1 text-label-small">
                  Unmapped
                </Badge>
              )}
            </div>
          );
        },
      }),
      helper.accessor("debit", {
        header: () => <div className="text-right">Debit</div>,
        cell: (i) => (
          <div className="text-right font-mono text-caption">
            {i.getValue() !== null ? formatIDR(i.getValue()!) : "-"}
          </div>
        ),
      }),
      helper.accessor("credit", {
        header: () => <div className="text-right">Credit</div>,
        cell: (i) => (
          <div className="text-right font-mono text-caption">
            {i.getValue() !== null ? formatIDR(i.getValue()!) : "-"}
          </div>
        ),
      }),
    ],
    [accountMappings],
  );

  const table = useReactTable({
    data: lines,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const totalDebit = useMemo(
    () => lines.reduce((a, b) => a + (b.debit || 0), 0),
    [lines],
  );
  const totalCredit = useMemo(
    () => lines.reduce((a, b) => a + (b.credit || 0), 0),
    [lines],
  );

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id} className="text-caption">
            {hg.headers.map((h) => (
              <TableHead
                key={h.id}
                className={`${h.id === "debit" || h.id === "credit" ? "text-right" : ""} ${h.id === "rowIndex" ? "w-10" : ""} ${h.id === "refNumber" ? "w-20" : ""}`}
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
        {table.getRowModel().rows.map((row) => {
          const line = row.original;
          const isUnmapped = !accountMappings.find(
            (m) =>
              m.excelRef === line.refNumber &&
              m.excelAccountName === line.accountName,
          )?.mappedRef;
          return (
            <TableRow
              key={row.id}
              className={isUnmapped ? "bg-destructive/10" : ""}
            >
              {row.getVisibleCells().map((c) => (
                <TableCell key={c.id}>
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell
            colSpan={3}
            className="text-right font-medium text-caption"
          >
            Total
          </TableCell>
          <TableCell className="text-right font-mono text-caption font-bold">
            {formatIDR(totalDebit)}
          </TableCell>
          <TableCell className="text-right font-mono text-caption font-bold">
            {formatIDR(totalCredit)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
