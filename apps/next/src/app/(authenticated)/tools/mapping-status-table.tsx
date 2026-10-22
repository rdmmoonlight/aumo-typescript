"use client";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { AccountMappingDetail } from "./types";

const helper = createColumnHelper<AccountMappingDetail>();

export function MappingStatusTable({
  mappings,
  dbAccounts,
  isLoadingCoa,
  onMappingChange,
}: {
  mappings: AccountMappingDetail[];
  dbAccounts: any[];
  isLoadingCoa: boolean;
  onMappingChange: (
    excelRef: number,
    excelName: string,
    targetRef: number,
  ) => void;
}) {
  const columns = useMemo(
    () => [
      helper.accessor("excelAccountName", {
        header: "Excel Input",
        cell: ({ row }) => (
          <div className="text-caption">
            <Badge
              variant="outline"
              className="font-mono text-label-small mr-1"
            >
              {row.original.excelRef}
            </Badge>
            {row.original.excelAccountName}
          </div>
        ),
      }),
      helper.accessor("mappedRef", {
        header: "Target COA",
        cell: ({ row }) => (
          <Select
            value={String(row.original.mappedRef || 0)}
            onValueChange={(v) =>
              onMappingChange(
                row.original.excelRef,
                row.original.excelAccountName,
                Number(v),
              )
            }
            disabled={isLoadingCoa}
          >
            <SelectTrigger className="h-7 text-caption">
              <SelectValue placeholder="Pilih COA" />
            </SelectTrigger>
            <SelectContent>
              {dbAccounts.map((o: any) => {
                const refNum = o.referenceNumber || o.code;
                const accName = o.accountName || o.name;
                return (
                  <SelectItem
                    key={o.id || refNum}
                    value={String(refNum)}
                    className="text-caption"
                  >
                    [{refNum}] {accName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ),
      }),
    ],
    [dbAccounts, isLoadingCoa, onMappingChange],
  );

  const table = useReactTable({
    data: mappings,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id} className="text-caption">
            {hg.headers.map((h) => (
              <TableHead key={h.id}>
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
          <TableRow
            key={row.id}
            className={row.original.mappedRef ? "bg-amber-500/10" : ""}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
