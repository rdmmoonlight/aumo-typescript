"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { store } from "@/lib/store";
import { settingsApi } from "@/lib/store/(authenticated)/settings/settingsApi";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  History,
  Laptop,
  Loader2,
  OctagonX,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  ActiveSessionsTable,
  ActivityItem,
  ActivityLogsTable,
  formatDate,
  SessionItem,
} from "./security-tables";

interface ApiCustomError {
  data?: { message?: string };
}

export function SecuritySection() {
  const [guardianTab, setGuardianTab] = useState("health");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [fetchError, setFetchError] = useState<any>(null);

  const [isRevoking, setIsRevoking] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  // Fetch data langsung via store.dispatch (Direct Call)
  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    const result = await store.dispatch(
      settingsApi.endpoints.getGuardianDashboard.initiate(undefined, {
        forceRefetch: true,
      }),
    );

    if (result.isSuccess) {
      const resp = result.data;
      setDashboardData((resp as Record<string, any>)?.data || resp);
    } else if (result.isError) {
      setIsError(true);
      setFetchError(result.error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const security = dashboardData?.securityStatus;
  const activities: ActivityItem[] = (
    dashboardData?.recentActivities || []
  ).slice(0, 5);
  const sessions: SessionItem[] = (dashboardData?.activeSessions || []).slice(
    0,
    5,
  );
  const isHealthy = security?.statusLevel === "Good";

  const notify = (msg: string, isErr = false) => {
    if (isErr) {
      setError(msg);
      setSuccess(null);
    } else {
      setSuccess(msg);
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleRevoke = async (id?: string, device?: string) => {
    if (!id || !confirm(`Akhiri sesi "${device}"?`)) return;
    setIsRevoking(true);
    try {
      const result = await store.dispatch(
        settingsApi.endpoints.revokeSessionById.initiate({
          sessionId: id,
        }),
      );

      if ("data" in result) {
        notify("Sesi diakhiri");
        await loadDashboard();
      } else {
        throw result.error;
      }
    } catch (e) {
      const err = e as ApiCustomError;
      notify(err?.data?.message || "Gagal mengakhiri sesi", true);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm("Lockout semua device lain?")) return;
    setIsRevokingAll(true);
    try {
      const result = await store.dispatch(
        settingsApi.endpoints.revokeAllSessions.initiate(),
      );

      if ("data" in result) {
        notify("Semua sesi lain diakhiri");
        await loadDashboard();
      } else {
        throw result.error;
      }
    } catch (e) {
      const err = e as ApiCustomError;
      notify(err?.data?.message || "Gagal mengakhiri semua sesi", true);
    } finally {
      setIsRevokingAll(false);
    }
  };

  return (
    <div className="space-y-3">
      {success && (
        <Alert className="py-2 bg-emerald-500/10 border-emerald-500/20 text-emerald-600 text-ui">
          <CheckCircle2 size={14} />
          <AlertDescription className="text-caption">
            {success}
          </AlertDescription>
        </Alert>
      )}
      {(error || isError) && (
        <Alert variant="destructive" className="py-2 text-ui">
          <AlertTriangle size={14} />
          <AlertDescription className="text-caption">
            {error || (fetchError as ApiCustomError)?.data?.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-ui font-semibold">Guardian Status</h3>
        <Badge
          variant="outline"
          className={cn(
            "gap-1.5 h-6 text-caption",
            isHealthy
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
              : "border-amber-500/20 bg-amber-500/10 text-amber-600",
          )}
        >
          <HeartPulse size={12} /> {security?.statusLevel || "Loading"}
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-caption">Memuat Guardian...</p>
        </div>
      ) : (
        <Tabs value={guardianTab} onValueChange={setGuardianTab}>
          <TabsList className="h-7 p-1 w-fit">
            <TabsTrigger value="health" className="text-caption h-5 gap-1">
              <Activity size={12} /> Health
            </TabsTrigger>
            <TabsTrigger value="sessions" className="text-caption h-5 gap-1">
              <Laptop size={12} /> Sessions{" "}
              <Badge
                variant="secondary"
                className="ml-1 h-4 px-1 text-label-small"
              >
                {sessions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-caption h-5 gap-1">
              <History size={12} /> Logs
            </TabsTrigger>
          </TabsList>
          <TabsContent value="health" className="mt-3">
            <div className="grid grid-cols-2 gap-3">
              <Card className="py-3 px-3 flex items-center justify-between">
                <div>
                  <p className="text-caption font-medium">Failed 24h</p>
                  <p className="text-caption text-muted-foreground">
                    Kegagalan login
                  </p>
                </div>
                {security?.failedAttemptsLast24Hours === 0 ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 text-label-small h-5">
                    0
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-label-small h-5">
                    {security?.failedAttemptsLast24Hours}
                  </Badge>
                )}
              </Card>
              <Card className="py-3 px-3 flex items-center justify-between">
                <div>
                  <p className="text-caption font-medium">Last Login</p>
                  <p className="text-caption text-muted-foreground">Terakhir</p>
                </div>
                <span className="text-caption font-mono">
                  {formatDate(security?.lastSuccessfulLogin)}
                </span>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="sessions" className="mt-3">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between py-2 px-3 border-b bg-muted/30">
                <span className="text-caption font-semibold">
                  Active Sessions
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-6 text-caption px-2 gap-1"
                  onClick={handleRevokeAll}
                  disabled={isRevokingAll}
                >
                  <OctagonX size={12} /> Revoke All
                </Button>
              </div>
              <ScrollArea className="h-64">
                <ActiveSessionsTable
                  sessions={sessions}
                  onRevoke={handleRevoke}
                  isRevoking={isRevoking}
                />
              </ScrollArea>
            </Card>
          </TabsContent>
          <TabsContent value="logs" className="mt-3">
            <Card className="overflow-hidden">
              <div className="py-2 px-3 border-b bg-muted/30">
                <span className="text-caption font-semibold">
                  Login History
                </span>
              </div>
              <ScrollArea className="h-64">
                <ActivityLogsTable activities={activities} />
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default SecuritySection;
