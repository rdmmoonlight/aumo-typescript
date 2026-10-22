// general-journal-table.tsx
"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Calendar, Clock, Pencil, Trash2 } from "lucide-react";
import { Fragment, useMemo } from "react";
import Link from "next/link";
import { formatDateTimeDisplay, formatNumber } from "../_lib/format";
import { FlatJournalRow } from "../_lib/types";

export function GeneralJournalTable({
  flatData,
  editMode,
  isDeleting,
  onPromptDelete,
}: any) {
  const columns = useMemo<ColumnDef<FlatJournalRow>[]>(
    () => [
      {
        id: "transactionNumber",
        header: () => (
          <span className="pl-4 text- font-semibold uppercase">
            No. Transaksi
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (!item.isFirstLine) return null;
          return (
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-amber-500">
                {item.transactionNumber}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <div>Dibuat: {formatDateTimeDisplay(item.createdAt)}</div>
                    {item.updatedAt && (
                      <div>Diubah: {formatDateTimeDisplay(item.updatedAt)}</div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {editMode && (
                <div className="inline-flex gap-1 ml-auto">
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                  >
                    <Link href={`/journal-entry?id=${item.entryId}`}>
                      <Pencil className="h-3 w-3" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => onPromptDelete(item.originalEntry)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "accountName",
        header: () => (
          <span className="text- font-semibold uppercase">Account</span>
        ),
        cell: ({ row, getValue }: any) => (
          <div
            className={
              row.original.debit > 0
                ? "font-semibold"
                : "pl-6 text-muted-foreground"
            }
          >
            {String(getValue() ?? "")}
          </div>
        ),
      },
      {
        accessorKey: "lineDescription",
        header: () => (
          <span className="text- font-semibold uppercase">Description</span>
        ),
        cell: ({ getValue }: any) => String(getValue() || "-"),
      },
      {
        accessorKey: "referenceNumber",
        header: () => (
          <div className="text-center text- font-semibold uppercase">Ref #</div>
        ),
        cell: ({ getValue }: any) => (
          <Badge variant="outline" className="font-mono text-xs text-amber-500">
            {String(getValue())}
          </Badge>
        ),
      },
      {
        accessorKey: "debit",
        header: () => (
          <div className="text-right text- font-semibold uppercase">Debit</div>
        ),
        cell: ({ getValue }: any) => {
          const v = Number(getValue() || 0);
          return (
            <div className="text-right font-mono text-emerald-500">
              {v > 0 ? formatNumber(v) : "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "credit",
        header: () => (
          <div className="text-right pr-4 text- font-semibold uppercase">
            Credit
          </div>
        ),
        cell: ({ getValue }: any) => {
          const v = Number(getValue() || 0);
          return (
            <div className="text-right pr-4 font-mono text-red-500">
              {v > 0 ? formatNumber(v) : "-"}
            </div>
          );
        },
      },
    ],
    [editMode, isDeleting],
  );

  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table className="min-w- table-fixed">
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
          <Fragment key={row.id}>
            {row.original.showHeader && (
              <TableRow className="bg-muted/40 border-y">
                <TableCell
                  colSpan={6}
                  className="py-1.5 pl-4 text-xs font-semibold"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-amber-500" />
                    {row.original.formattedDate}
                  </div>
                </TableCell>
              </TableRow>
            )}
            <TableRow
              className={`${row.original.groupIdx % 2 === 0 ? "bg-muted/10" : ""} hover:bg-muted/20 border-b-0`}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-2.5 text-xs h-10">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
