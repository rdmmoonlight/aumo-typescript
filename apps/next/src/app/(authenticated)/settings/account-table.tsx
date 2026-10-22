"use client";
import { Badge } from "@/components/ui/badge";
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

export interface UserProfileField {
  label: string;
  value: string;
  status: "Verified" | "Editable" | "Readonly";
}

const columnHelper = createColumnHelper<UserProfileField>();

export function AccountDetailsTable({ data }: { data: UserProfileField[] }) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("label", {
        header: "Atribut Profil",
        cell: (info) => (
          <span className="font-medium text-xs text-muted-foreground">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("value", {
        header: "Nilai Terdaftar",
        cell: (info) => (
          <span className="font-semibold text-xs text-foreground">
            {info.getValue() || "---"}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Akses / Status",
        cell: (info) => {
          const val = info.getValue();
          return (
            <Badge
              variant={val === "Verified" ? "default" : "outline"}
              className="text- py-0 px-1.5"
            >
              {val}
            </Badge>
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
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id} className="text-xs">
            {hg.headers.map((h) => (
              <TableHead key={h.id} className="h-8">
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
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className="py-2">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
