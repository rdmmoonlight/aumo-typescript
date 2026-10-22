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
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { LogOut } from "lucide-react";
import { useMemo } from "react";

export interface SessionItem {
  id?: string;
  deviceName?: string;
  isCurrent?: boolean;
  browser?: string;
  operatingSystem?: string;
  ipAddress?: string;
  country?: string;
  lastActivityAt?: string;
}
export interface ActivityItem {
  id?: string;
  activityType?: string;
  device?: string;
  operatingSystem?: string;
  ipAddress?: string;
  createdAt?: string;
  isSuccess?: boolean;
}

export const formatDate = (dateStr?: string) =>
  dateStr
    ? new Date(dateStr).toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "-";

const sessionHelper = createColumnHelper<SessionItem>();
const activityHelper = createColumnHelper<ActivityItem>();

export function ActiveSessionsTable({
  sessions,
  onRevoke,
  isRevoking,
}: {
  sessions: SessionItem[];
  onRevoke: (id?: string, deviceName?: string) => void;
  isRevoking: boolean;
}) {
  const columns = useMemo(
    () => [
      sessionHelper.accessor("deviceName", {
        header: "Device",
        cell: ({ row }) => (
          <div className="py-1.5 text-caption font-medium">
            {row.original.deviceName}
            {row.original.isCurrent && (
              <Badge className="ml-1 h-4 text-label-small bg-emerald-500/15 text-emerald-600">
                Current
              </Badge>
            )}
          </div>
        ),
      }),
      sessionHelper.accessor("browser", {
        header: "Browser/OS",
        cell: ({ row }) => (
          <div className="py-1.5 text-caption text-muted-foreground">
            {row.original.browser}
            <div className="text-caption">{row.original.operatingSystem}</div>
          </div>
        ),
      }),
      sessionHelper.accessor("ipAddress", {
        header: "IP",
        cell: ({ row }) => (
          <div className="py-1.5 font-mono text-caption">
            {row.original.ipAddress}
            <div className="text-caption text-muted-foreground">
              {row.original.country}
            </div>
          </div>
        ),
      }),
      sessionHelper.accessor("lastActivityAt", {
        header: "Last",
        cell: (info) => (
          <div className="py-1.5 text-caption">
            {info.getValue()
              ? new Date(info.getValue()!).toLocaleTimeString("id-ID")
              : "-"}
          </div>
        ),
      }),
      sessionHelper.display({
        id: "actions",
        header: () => <div className="text-right text-caption h-7" />,
        cell: ({ row }) => (
          <div className="py-1.5 text-right">
            {!row.original.isCurrent ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-caption text-destructive px-2"
                onClick={() =>
                  onRevoke(row.original.id, row.original.deviceName)
                }
                disabled={isRevoking}
              >
                <LogOut size={11} />
              </Button>
            ) : (
              <span className="text-caption text-emerald-600">Active</span>
            )}
          </div>
        ),
      }),
    ],
    [onRevoke, isRevoking],
  );

  const table = useReactTable({
    data: sessions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id} className="h-7">
            {hg.headers.map((h) => (
              <TableHead key={h.id} className="text-caption h-7">
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
          <TableRow key={row.id} className="h-9">
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className="p-0 px-4">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ActivityLogsTable({
  activities,
}: {
  activities: ActivityItem[];
}) {
  const columns = useMemo(
    () => [
      activityHelper.accessor("activityType", {
        header: "Type",
        cell: (info) => (
          <div className="py-1.5 text-caption">{info.getValue()}</div>
        ),
      }),
      activityHelper.accessor("device", {
        header: "Device",
        cell: ({ row }) => (
          <div className="py-1.5 text-caption text-muted-foreground">
            {row.original.device}
            <div className="text-caption">{row.original.operatingSystem}</div>
          </div>
        ),
      }),
      activityHelper.accessor("ipAddress", {
        header: "IP",
        cell: (info) => (
          <div className="py-1.5 font-mono text-caption">{info.getValue()}</div>
        ),
      }),
      activityHelper.accessor("createdAt", {
        header: "Date",
        cell: (info) => (
          <div className="py-1.5 text-caption">
            {formatDate(info.getValue())}
          </div>
        ),
      }),
      activityHelper.accessor("isSuccess", {
        header: () => <div className="text-right text-caption">Status</div>,
        cell: (info) => (
          <div className="py-1.5 text-right">
            {info.getValue() ? (
              <Badge className="h-4 text-label-small bg-emerald-500/15 text-emerald-600">
                OK
              </Badge>
            ) : (
              <Badge variant="destructive" className="h-4 text-label-small">
                Fail
              </Badge>
            )}
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: activities,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id} className="h-7">
            {hg.headers.map((h) => (
              <TableHead key={h.id} className="text-caption h-7">
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
          <TableRow key={row.id} className="h-9">
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className="p-0 px-4">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
