"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowRight,
  LucideIcon,
  Palette,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AccountSettings from "./account";
import { AppearanceSection } from "./appearance";
import { SecuritySection } from "./security";

interface SettingModuleItem {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  status: string;
}
const columnHelper = createColumnHelper<SettingModuleItem>();

function SettingsOverviewTable({
  data,
  activeTab,
  onSelectTab,
}: {
  data: SettingModuleItem[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Modul Pengaturan",
        cell: ({ row }) => {
          const IconComponent = row.original.icon;
          return (
            <div className="flex items-center gap-2">
              <IconComponent size={15} className="text-foreground" />
              <span className="font-semibold text-caption text-foreground">
                {row.original.name}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("description", {
        header: "Cakupan Modul",
        cell: (info) => (
          <span className="text-caption text-muted-foreground">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.original.id === activeTab;
          return (
            <Badge
              variant={isActive ? "default" : "outline"}
              className="text-label-small py-0 px-1.5 border-border text-foreground data-[variant=default]:bg-white data-[variant=default]:text-black"
            >
              {isActive ? "Aktif Diampu" : row.original.status}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: "action",
        header: () => <div className="text-right text-foreground">Aksi</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-caption gap-1 px-2 text-foreground hover:bg-white hover:text-black"
              onClick={() => onSelectTab(row.original.id)}
            >
              Buka <ArrowRight size={12} />
            </Button>
          </div>
        ),
      }),
    ],
    [activeTab, onSelectTab],
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
          <TableRow
            key={hg.id}
            className="text-caption h-8 border-border hover:bg-transparent"
          >
            {hg.headers.map((h) => (
              <TableHead
                key={h.id}
                className="h-8 text-caption text-muted-foreground"
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
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className="border-border hover:bg-muted/50">
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className="py-2 text-foreground">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [mainTab, setMainTab] = useState("account");
  useEffect(() => setMounted(true), []);

  const settingsModules = useMemo<SettingModuleItem[]>(
    () => [
      {
        id: "account",
        name: "Account",
        icon: User,
        description: "Profil pengguna, email, kredensial, dan foto avatar",
        status: "Tersedia",
      },
      {
        id: "appearance",
        name: "Appearance",
        icon: Palette,
        description: "Tema visual antarmuka (Light, Dark, System)",
        status: "Tersedia",
      },
      {
        id: "security",
        name: "Security",
        icon: ShieldCheck,
        description: "Guardian health, manajemen sesi aktif, dan riwayat login",
        status: "Tersedia",
      },
    ],
    [],
  );

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-72px)] space-y-4 text-foreground selection:bg-white selection:text-black">
      <Card className="shrink-0 bg-card text-card-foreground border-border">
        <CardContent className="p-0">
          <SettingsOverviewTable
            data={settingsModules}
            activeTab={mainTab}
            onSelectTab={setMainTab}
          />
        </CardContent>
      </Card>
      <Tabs
        value={mainTab}
        onValueChange={setMainTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="shrink-0 space-y-3 relative z-20 pb-3">
          <div className="flex items-center justify-between">
            <h1 className="text-h3 font-bold text-foreground">Settings</h1>
          </div>
          <TabsList className="h-8 p-1 w-fit bg-zinc-100 dark:bg-muted text-muted-foreground border border-border">
            <TabsTrigger
              value="account"
              className="text-caption gap-1.5 h-6 px-3 rounded-sm transition-all text-zinc-500 dark:text-zinc-400 data-[state=active]:bg-white data-[state=active]:!text-black data-[state=active]:[&_svg]:!text-black data-[state=active]:shadow-sm data-[state=active]:font-semibold"
            >
              <User size={13} className="text-current" /> Account
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="text-caption gap-1.5 h-6 px-3 rounded-sm transition-all text-zinc-500 dark:text-zinc-400 data-[state=active]:bg-white data-[state=active]:!text-black data-[state=active]:[&_svg]:!text-black data-[state=active]:shadow-sm data-[state=active]:font-semibold"
            >
              <Palette size={13} className="text-current" /> Appearance
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="text-caption gap-1.5 h-6 px-3 rounded-sm transition-all text-zinc-500 dark:text-zinc-400 data-[state=active]:bg-white data-[state=active]:!text-black data-[state=active]:[&_svg]:!text-black data-[state=active]:shadow-sm data-[state=active]:font-semibold"
            >
              <ShieldCheck size={13} className="text-current" /> Security
            </TabsTrigger>
          </TabsList>
          <Separator className="bg-border" />
        </div>
        <div className="flex-1 overflow-y-auto mt-1 relative z-10">
          <TabsContent
            value="account"
            className="m-0 focus-visible:outline-none text-foreground"
          >
            <AccountSettings />
          </TabsContent>
          <TabsContent
            value="appearance"
            className="m-0 focus-visible:outline-none text-foreground"
          >
            <AppearanceSection />
          </TabsContent>
          <TabsContent
            value="security"
            className="m-0 focus-visible:outline-none text-foreground"
          >
            <SecuritySection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
