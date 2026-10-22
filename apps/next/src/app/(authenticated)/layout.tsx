"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { AppFooter } from "@/components/app-footer";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopBar } from "@/components/app-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { AppDispatch, RootState } from "@/lib/store";
import { periodsApi } from "@/lib/store/(authenticated)/periods/periodsApi";
import { authApi } from "@/lib/store/auth/authApi";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // State lokal untuk melacak status fetching
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthError, setIsAuthError] = useState(false);
  const [isPeriodsLoading, setIsPeriodsLoading] = useState(false);

  // Ambil data cache langsung dari Redux Store jika ada
  const authState = useSelector((state: RootState) =>
    authApi.endpoints.getProfile.select()(state),
  );

  const verifySessionAndLoadData = useCallback(async () => {
    try {
      setIsAuthLoading(true);

      // 1. Eksekusi request GET /auth/me langsung via initiate
      const authResult = await dispatch(
        authApi.endpoints.getProfile.initiate(undefined, {
          forceRefetch: false,
        }),
      );

      if (authResult.isError || !authResult.data) {
        setIsAuthError(true);
        setIsAuthLoading(false);
        return;
      }

      setIsAuthError(false);
      setIsAuthLoading(false);

      // 2. Jika auth berhasil, muat data periode
      setIsPeriodsLoading(true);
      await dispatch(
        periodsApi.endpoints.getPeriodsOpenInfo.initiate(undefined, {
          forceRefetch: false,
        }),
      );
    } catch {
      setIsAuthError(true);
    } finally {
      setIsAuthLoading(false);
      setIsPeriodsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    verifySessionAndLoadData();
  }, [verifySessionAndLoadData]);

  useEffect(() => {
    if (isAuthError) {
      const t = setTimeout(() => router.replace("/auth"), 800);
      return () => clearTimeout(t);
    }
  }, [isAuthError, router]);

  // Render kondisi loading HANYA saat verifikasi awal
  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Memverifikasi sesi...</p>
      </div>
    );
  }

  if (isAuthError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          Sesi berakhir, mengalihkan ke halaman login...
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "285px",
            "--sidebar-width-icon": "3.5rem",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col min-w-0">
          <AppTopBar />
          <main className="relative flex-1 p-6">
            {isPeriodsLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                <p className="text-sm text-muted-foreground">
                  Memuat periode...
                </p>
              </div>
            )}
            {children}
          </main>
          <AppFooter />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
