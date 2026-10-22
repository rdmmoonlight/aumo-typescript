"use client";

import {
  AccountOption,
  columnHelper,
  formatIDR,
  LineItem,
} from "@/app/(authenticated)/journal-entry/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";

type Props = {
  fields: LineItem[];
  availableAccounts: AccountOption[];
  watchedLines: any[];
  register: any;
  setValue: any;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
  onAmountChange: (
    index: number,
    field: "debit" | "credit",
    value: string,
  ) => void;
};

export function JournalLinesTable({
  fields,
  availableAccounts,
  watchedLines,
  register,
  setValue,
  totalDebit,
  totalCredit,
  isBalanced,
  onAddLine,
  onRemoveLine,
  onAmountChange,
}: Props) {
  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.accountId, {
        id: "referenceNumber",
        header: () => (
          <span className="text- font-semibold uppercase tracking-wider text-muted-foreground">
            Ref
          </span>
        ),
        cell: ({ row }) => {
          const ref = availableAccounts.find(
            (a) => a.id === row.original.accountId,
          )?.referenceNumber;
          return (
            <Input
              className="h-8 text-center text-xs bg-muted font-mono"
              readOnly
              value={ref || ""}
              placeholder="---"
            />
          );
        },
      }),
      columnHelper.accessor("accountId", {
        header: () => (
          <span className="text- font-semibold uppercase tracking-wider text-muted-foreground">
            Account
          </span>
        ),
        cell: ({ row }) => {
          const index = row.index;
          const currentAccountId = watchedLines?.[index]?.accountId;
          return (
            <Select
              value={currentAccountId ? String(currentAccountId) : ""}
              onValueChange={(v) =>
                setValue(`lines.${index}.accountId`, Number(v), {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                {availableAccounts.map((acc) => (
                  <SelectItem
                    key={acc.id}
                    value={String(acc.id)}
                    className="text-xs"
                  >
                    {acc.referenceNumber} - {acc.accountName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
      }),
      columnHelper.accessor("lineDescription", {
        header: () => (
          <span className="text- font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </span>
        ),
        cell: ({ row }) => (
          <Input
            className="h-8 text-xs"
            placeholder="Note..."
            {...register(`lines.${row.index}.lineDescription`)}
          />
        ),
      }),
      columnHelper.accessor("debit", {
        header: () => (
          <div className="text-right text- font-semibold uppercase tracking-wider text-muted-foreground">
            Debit
          </div>
        ),
        cell: ({ row }) => (
          <Input
            className="h-8 text-xs text-right font-mono"
            placeholder="0"
            value={watchedLines?.[row.index]?.debit || ""}
            onChange={(e) => onAmountChange(row.index, "debit", e.target.value)}
          />
        ),
      }),
      columnHelper.accessor("credit", {
        header: () => (
          <div className="text-right text- font-semibold uppercase tracking-wider text-muted-foreground">
            Credit
          </div>
        ),
        cell: ({ row }) => (
          <Input
            className="h-8 text-xs text-right font-mono"
            placeholder="0"
            value={watchedLines?.[row.index]?.credit || ""}
            onChange={(e) =>
              onAmountChange(row.index, "credit", e.target.value)
            }
          />
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => (
          <div className="text-center text- font-semibold uppercase tracking-wider text-muted-foreground">
            Action
          </div>
        ),
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onRemoveLine(row.index)}
          >
            <Trash2 size={14} />
          </Button>
        ),
      }),
    ],
    [
      availableAccounts,
      watchedLines,
      register,
      setValue,
      onRemoveLine,
      onAmountChange,
    ],
  );

  const table = useReactTable({
    data: (fields as LineItem[]) || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Journal Lines</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={onAddLine}
        >
          <Plus size={12} /> Add Line
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.id === "referenceNumber"
                        ? "w-[10%]"
                        : header.id === "accountId"
                          ? "w-[28%]"
                          : header.id === "debit" || header.id === "credit"
                            ? "text-right w-[15%]"
                            : header.id === "actions"
                              ? "w-[5%]"
                              : ""
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
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
            <TableRow>
              <TableCell colSpan={3} className="text-right text-xs font-medium">
                Total:
              </TableCell>
              <TableCell className="text-right font-mono text-xs text-emerald-500">
                Rp {formatIDR(totalDebit)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs text-red-500">
                Rp {formatIDR(totalCredit)}
              </TableCell>
              <TableCell />
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="text-right text-xs">
                Status:
              </TableCell>
              <TableCell colSpan={2} className="text-center">
                {isBalanced ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 text- gap-1">
                    <CheckCircle2 size={12} /> Balanced
                  </Badge>
                ) : (
                  <Badge
                    variant="destructive"
                    className="gap-1 bg-red-500/15 text-red-500 border-red-500/20 text-"
                  >
                    <AlertTriangle size={12} /> Unbalanced Rp{" "}
                    {formatIDR(Math.abs(totalDebit - totalCredit))}
                  </Badge>
                )}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
