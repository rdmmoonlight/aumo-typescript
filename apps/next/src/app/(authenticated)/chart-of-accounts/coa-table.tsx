"use client";

import {
  AddAccountDialog,
  DeleteAccountAlertDialog,
  EditAccountDialog,
} from "@/app/(authenticated)/chart-of-accounts/coa-dialogs";
import {
  ACCOUNT_RANGES,
  ACCOUNT_TYPES,
  AccountItem,
} from "@/app/(authenticated)/chart-of-accounts/coa-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { store } from "@/lib/store";
import { chartOfAccountsApi } from "@/lib/store/(authenticated)/chart-of-accounts/chartOfAccountsApi";
import { cn } from "@/lib/utils";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  BookOpen,
  Check,
  Network,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

export function ChartOfAccountsTable() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State untuk penanganan data fetch manual
  const [rawAccountsData, setRawAccountsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Fungsi fetch data langsung via store.dispatch (tanpa React Hooks RTK)
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      const result = await store.dispatch(
        chartOfAccountsApi.endpoints.getChartOfAccounts.initiate({
          search: searchText || undefined,
          category: categoryFilter || undefined,
        }),
      );

      if ("data" in result) {
        setRawAccountsData(result.data);
      } else if ("error" in result) {
        setIsError(true);
        setErrorMessage("Gagal mengambil data Chart of Accounts dari server.");
      }
    } catch {
      setIsError(true);
      setErrorMessage("Terjadi kesalahan sistem saat mengambil data.");
    } finally {
      setIsLoading(false);
    }
  }, [searchText, categoryFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const rawAccounts = useMemo<AccountItem[]>(() => {
    if (!rawAccountsData) return [];
    let list: any[] = [];
    if (typeof rawAccountsData === "object") {
      const res = rawAccountsData as any;
      if (Array.isArray(res.accounts)) list = res.accounts;
      else if (Array.isArray(res.data)) list = res.data;
      else if (Array.isArray(rawAccountsData)) list = rawAccountsData;
    }
    return list.map((item) => ({
      ...item,
      id: Number(item.id || 0),
      referenceNumber: item.referenceNumber ?? "",
      accountName: item.accountName ?? "",
      type: item.type ?? "",
      role: item.role ?? "Default",
      balance: item.balance ?? 0,
      isActive: Boolean(item.isActive),
    })) as AccountItem[];
  }, [rawAccountsData]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<AccountItem | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<AccountItem | null>(
    null,
  );

  const filteredAccounts = useMemo(() => {
    if (!Array.isArray(rawAccounts)) return [];
    return rawAccounts.filter((acc) => {
      const matchSearch =
        !searchText ||
        acc.accountName?.toLowerCase().includes(searchText.toLowerCase()) ||
        acc.referenceNumber?.toString().includes(searchText);
      const matchCat = !categoryFilter || acc.type === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [rawAccounts, searchText, categoryFilter]);

  const columns = useMemo<ColumnDef<AccountItem>[]>(() => {
    const cols: ColumnDef<AccountItem>[] = [
      {
        accessorKey: "referenceNumber",
        header: () => (
          <span className="pl-6 font-semibold uppercase tracking-wider text-muted-foreground">
            Ref
          </span>
        ),
        meta: { headerClassName: "w-24 pl-6", cellClassName: "pl-6" },
        cell: ({ getValue }) => (
          <span className="font-mono text-primary text-sm font-medium">
            {String(getValue() ?? "")}
          </span>
        ),
      },
      {
        accessorKey: "accountName",
        header: () => (
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">
            Name
          </span>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">
            {String(getValue() ?? "")}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: () => (
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">
            Category
          </span>
        ),
        cell: ({ getValue }) => (
          <Badge variant="outline" className="text-xs">
            {String(getValue() ?? "")}
          </Badge>
        ),
      },
      {
        accessorKey: "role",
        header: () => (
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">
            Role
          </span>
        ),
        cell: ({ getValue }) => {
          const role = getValue<string | undefined>();
          return role && role !== "Default" ? (
            <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 text-xs">
              {role}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Standard</span>
          );
        },
      },
      {
        accessorKey: "balance",
        header: () => (
          <div className="text-right font-semibold uppercase tracking-wider text-muted-foreground">
            Balance
          </div>
        ),
        meta: { cellClassName: "text-right" },
        cell: ({ getValue }) => {
          const balance = Number(getValue() || 0);
          return (
            <span
              className={cn(
                "font-medium font-mono text-sm",
                balance >= 0 ? "text-emerald-500" : "text-red-500",
              )}
            >
              {balance.toLocaleString("id-ID")}
            </span>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: () => (
          <div className="text-center font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </div>
        ),
        meta: { cellClassName: "text-center" },
        cell: ({ getValue }) => {
          const isActive = Boolean(getValue());
          return (
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={cn(
                "text-xs",
                isActive &&
                  "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
              )}
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
    ];

    if (isEditMode) {
      cols.push({
        id: "actions",
        header: () => (
          <div className="text-center pr-6 font-semibold uppercase tracking-wider text-muted-foreground">
            Action
          </div>
        ),
        meta: { cellClassName: "pr-6" },
        cell: ({ row }) => {
          const acc = row.original;
          return (
            <div className="flex justify-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setEditAccount({ ...acc });
                  setIsEditModalOpen(true);
                }}
              >
                <Pencil size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <Link
                  href={`/reports/general-ledger/permanent#account-${acc.id}`}
                >
                  <BookOpen size={14} />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => setAccountToDelete(acc)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          );
        },
      });
    }
    return cols;
  }, [isEditMode]);

  const table = useReactTable({
    data: filteredAccounts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleSuccessAction = (msg: string) => {
    setSuccessMessage(msg);
    fetchAccounts(); // Re-fetch data setelah mutasi berhasil
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Network className="text-primary" size={24} /> Chart of Accounts
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-3 text-muted-foreground"
              />
              <Input
                className="pl-8 h-9 w-52 text-sm"
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-40 text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="text-sm">
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ACCOUNT_RANGES[t]?.label ?? t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoryFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCategoryFilter("")}
                className="h-9 px-2"
              >
                <X size={14} />
              </Button>
            )}
            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2 text-sm font-medium h-9"
            >
              <Plus size={16} /> New Account
            </Button>
            <Button
              variant={isEditMode ? "default" : "outline"}
              onClick={() => setIsEditMode((prev) => !prev)}
              className="gap-2 text-sm font-medium h-9"
            >
              {isEditMode ? <Check size={16} /> : <Pencil size={16} />}
              {isEditMode ? "Done Editing" : "Edit"}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <span>Master list of financial accounts</span>
          <span>•</span>
          <Badge variant="secondary" className="font-mono text-xs font-normal">
            {filteredAccounts.length} accounts
          </Badge>
          <span>•</span>
          <span className="text-xs text-muted-foreground font-medium">
            in IDR (Rp)
          </span>
        </p>
      </div>

      {(errorMessage || isError) && (
        <Alert
          variant="destructive"
          className="flex justify-between items-center py-2"
        >
          <AlertDescription className="text-xs">
            {errorMessage ||
              "Gagal mengambil data Chart of Accounts dari server."}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive-foreground hover:bg-destructive/20"
            onClick={() => setErrorMessage(null)}
          >
            <X size={14} />
          </Button>
        </Alert>
      )}
      {successMessage && (
        <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex justify-between items-center py-2">
          <AlertDescription className="text-xs">
            {successMessage}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-emerald-500/20"
            onClick={() => setSuccessMessage(null)}
          >
            <X size={14} />
          </Button>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as
                      { headerClassName?: string } | undefined;
                    return (
                      <TableHead
                        key={header.id}
                        className={meta?.headerClassName}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-10 text-xs text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => {
                  const acc = row.original;
                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        highlightId === String(acc.id) && "bg-primary/10",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta as
                          { cellClassName?: string } | undefined;
                        return (
                          <TableCell
                            key={cell.id}
                            className={meta?.cellClassName}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-12 text-xs text-muted-foreground"
                  >
                    No accounts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddAccountDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        accounts={rawAccounts as any}
        onSuccess={handleSuccessAction}
      />
      {editAccount && (
        <EditAccountDialog
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          account={editAccount as any}
          onSuccess={handleSuccessAction}
        />
      )}
      <DeleteAccountAlertDialog
        account={accountToDelete as any}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
        onSuccess={handleSuccessAction}
        onError={(msg) => setErrorMessage(msg)}
      />
    </div>
  );
}
