"use client";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Bell,
  Database,
  Info,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import * as React from "react";

import { store } from "@/lib/store";
import { periodsApi } from "@/lib/store/(authenticated)/periods/periodsApi";
import { authApi } from "@/lib/store/auth/authApi";
import { commonApi } from "@/lib/store/commonApi";

interface PeriodItem {
  id: number;
  periodName?: string;
  name?: string;
  isClosed?: boolean;
  isSelected?: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: "info" | "warning" | string;
  isRead: boolean;
  createdAt?: string;
}

export function AppTopBar() {
  const pathname = usePathname();

  // State internal pengganti Auto-Generated Hooks
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = React.useState(true);

  const [rawPeriodsData, setRawPeriodsData] = React.useState<any>(null);
  const [isPeriodLoading, setIsPeriodLoading] = React.useState(false);

  const [healthData, setHealthData] = React.useState<any>(null);
  const [isHealthLoading, setIsHealthLoading] = React.useState(false);
  const [isHealthFetching, setIsHealthFetching] = React.useState(false);
  const [isHealthError, setIsHealthError] = React.useState(false);

  const [notifications, setNotifications] = React.useState<NotificationItem[]>(
    [],
  );
  const [isNotificationsLoading, setIsNotificationsLoading] =
    React.useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = React.useState(false);

  const isAuthenticated = !isProfileLoading && !!userProfile;

  // 1. Fetch Profil User (/auth/me)
  const fetchUserProfile = React.useCallback(async () => {
    setIsProfileLoading(true);
    try {
      const result = await store.dispatch(
        authApi.endpoints.getProfile.initiate(),
      );
      if ("data" in result && result.data) {
        setUserProfile(result.data);
      } else {
        setUserProfile(null);
      }
    } catch {
      setUserProfile(null);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  // 2. Fetch Periods
  const fetchPeriods = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setIsPeriodLoading(true);
    try {
      const result = await store.dispatch(
        periodsApi.endpoints.getPeriods.initiate(),
      );
      if ("data" in result) {
        setRawPeriodsData(result.data);
      }
    } catch {
      setRawPeriodsData(null);
    } finally {
      setIsPeriodLoading(false);
    }
  }, [isAuthenticated]);

  // 3. Database Health Check
  const checkDb = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setIsHealthFetching(true);
    try {
      const result = await store.dispatch(
        commonApi.endpoints.getHealth.initiate(),
      );
      if ("data" in result && result.data) {
        setHealthData(result.data);
        setIsHealthError(false);
      } else {
        setIsHealthError(true);
      }
    } catch {
      setIsHealthError(true);
    } finally {
      setIsHealthLoading(false);
      setIsHealthFetching(false);
    }
  }, [isAuthenticated]);

  // 4. Fetch Notifikasi
  const fetchNotifications = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setIsNotificationsLoading(true);
    try {
      const result = await store.dispatch(
        commonApi.endpoints.getNotifications.initiate({ limit: 20 }),
      );
      if ("data" in result && Array.isArray(result.data)) {
        setNotifications(result.data as NotificationItem[]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setIsNotificationsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial Load & Polling setup
  React.useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchPeriods();
      checkDb();
      fetchNotifications();

      // Setup Polling Interval Manual
      const healthInterval = setInterval(checkDb, 30000);
      const notifInterval = setInterval(fetchNotifications, 15000);

      return () => {
        clearInterval(healthInterval);
        clearInterval(notifInterval);
      };
    }
  }, [isAuthenticated, fetchPeriods, checkDb, fetchNotifications]);

  // Handlers untuk Notifikasi
  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      const result = await store.dispatch(
        commonApi.endpoints.markAllNotificationsAsRead.initiate(),
      );
      if ("data" in result) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Gagal menandai semua dibaca:", error);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleMarkAsRead = async (id: string, isRead?: boolean) => {
    if (isRead || !id) return;
    try {
      const result = await store.dispatch(
        commonApi.endpoints.markNotificationAsRead.initiate({ id }),
      );
      if ("data" in result) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Gagal menandai dibaca:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Penentuan status database
  const dbStatus = isHealthError
    ? "offline"
    : isHealthLoading
      ? "connecting"
      : healthData
        ? "online"
        : "offline";

  // Parsing array periods
  const periods: PeriodItem[] = Array.isArray(rawPeriodsData)
    ? rawPeriodsData
    : (rawPeriodsData as any)?.items || (rawPeriodsData as any)?.periods || [];

  const selectedPeriod = periods.find((p) => p.isSelected);
  const pathSegments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex flex-col w-full border-b bg-background sticky top-0 z-10 shadow-sm">
      {/* KELOMPOK 1: Bar Utama (Search & Notifications) */}
      <div className="flex h-16 items-center justify-between pl-3 pr-4 gap-4">
        {/* Sisi Kiri: Search Bar */}
        <div className="flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari transaksi, akun, atau laporan..."
              className="pl-9 bg-muted/40 text-sm focus-visible:bg-background"
            />
          </div>
        </div>

        {/* Sisi Kanan: Notifikasi */}
        <div className="flex items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground"
                aria-label="Notifikasi"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4" align="end">
              {/* Header Popover */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">Notifikasi</h4>
                  {unreadCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-1.5 py-0.5"
                    >
                      {unreadCount} baru
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    disabled={isMarkingAllRead}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isMarkingAllRead ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Tandai dibaca"
                    )}
                  </Button>
                )}
              </div>

              {/* List Notifikasi */}
              <div className="max-h-[300px] overflow-y-auto divide-y">
                {isNotificationsLoading ? (
                  <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Memuat
                    notifikasi...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Tidak ada notifikasi saat ini.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleMarkAsRead(item.id, item.isRead)}
                      className={`p-3 text-[13px] cursor-pointer transition-colors hover:bg-muted/50 flex gap-3 ${
                        !item.isRead ? "bg-muted/20 font-medium" : "opacity-70"
                      }`}
                    >
                      <div className="mt-0.5">
                        {item.type === "warning" ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Info className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground text-sm">
                            {item.title}
                          </p>
                          <span className="text-[11px] text-muted-foreground">
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )
                              : ""}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-[13px]">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Separator />

      {/* KELOMPOK 2: Bar Sekunder */}
      <div className="flex h-10 items-center justify-between pl-3 pr-4 bg-muted/20 text-xs">
        {/* Dynamic Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/home" className="text-xs">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            {pathSegments.map((segment: string, index: number) => {
              if (segment === "home" && index === 0) return null;

              const url = `/${pathSegments.slice(0, index + 1).join("/")}`;
              const isLast = index === pathSegments.length - 1;
              const formattedName = decodeURIComponent(segment)
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());

              return (
                <React.Fragment key={url}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="text-xs font-semibold">
                        {formattedName}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={url} className="text-xs">
                        {formattedName}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Status Periode & Indikator DB */}
        <div className="flex items-center gap-4 text-muted-foreground">
          {selectedPeriod ? (
            <Badge
              variant="outline"
              className={`gap-1.5 font-medium text-xs ${
                selectedPeriod.isClosed
                  ? "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                  : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  selectedPeriod.isClosed
                    ? "bg-amber-500"
                    : "bg-emerald-500 animate-pulse"
                }`}
              />
              Periode: {selectedPeriod.periodName || selectedPeriod.name}
              {selectedPeriod.isClosed ? " (Closed)" : " (Aktif)"}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1.5 font-medium text-xs text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              {isPeriodLoading
                ? "Memuat periode..."
                : "Belum Ada Periode Dipilih"}
            </Badge>
          )}

          <Separator orientation="vertical" className="h-3" />

          {/* Indikator Database */}
          <div className="flex items-center gap-2 text-xs">
            <Database className="h-3.5 w-3.5 text-muted-foreground" />

            {dbStatus === "online" && (
              <Badge
                variant="outline"
                className="gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-medium text-xs"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                DB: Connected
              </Badge>
            )}

            {dbStatus === "connecting" && (
              <Badge
                variant="outline"
                className="gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-medium text-xs"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                DB: Connecting...
              </Badge>
            )}

            {dbStatus === "offline" && (
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="destructive"
                  className="gap-1.5 font-medium text-xs"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground" />
                  DB: Disconnected
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => checkDb()}
                  disabled={isHealthFetching}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Coba hubungkan ulang"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isHealthFetching ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
