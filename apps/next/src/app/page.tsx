"use client";

import { AuthFormSkeleton, GOOGLE_CLIENT_ID } from "@/app/auth/auth";
import LoginPage from "@/app/auth/login";
import RegisterPage from "@/app/auth/register";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { store } from "@/lib/store";
import { authApi } from "@/lib/store/auth/authApi";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ArrowRight, Loader2, Lock, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  Card,
  Metric,
  Text,
  AreaChart,
  BarList,
  Flex,
  BadgeDelta,
} from "@tremor/react";

const chartData = [
  { date: "Jan", Revenue: 12200 },
  { date: "Feb", Revenue: 18500 },
  { date: "Mar", Revenue: 16300 },
  { date: "Apr", Revenue: 24400 },
  { date: "Mei", Revenue: 19800 },
  { date: "Jun", Revenue: 28450 },
];

const opsData = [
  { name: "Revenues & Expenses", value: 420 },
  { name: "Tracking", value: 310 },
  { name: "Finance & Costings", value: 280 },
];

export default function LandingPage(): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    document.title = "Aumo Finance | Operations, neatly organized.";
    async function checkAuthStatus() {
      try {
        setCheckingAuth(true);
        const result = await store.dispatch(
          authApi.endpoints.getProfile.initiate()
        );
        if (result.isSuccess && result.data?.success) {
          setIsAuthenticated(true);
          router.replace("/home");
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuthStatus();
  }, [router]);

  const handleOpenModal = (mode: "login" | "register"): void => {
    setAuthMode(mode);
    setOpen(true);
  };

  const handleSuccess = (): void => {
    setOpen(false);
    router.replace("/home");
  };

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black text-white">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Redirecting to dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full bg-black text-white lg:grid-cols-[1.15fr_1fr]">
      {/* LEFT */}
      <div className="flex flex-col justify-between border-r border-zinc-800 bg-zinc-950 p-8 lg:p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-white font-bold text-black">
            A
          </div>
          <span className="text-sm font-semibold tracking-tight">
            AUMO FINANCE
          </span>
        </div>

        <div className="mt-12 lg:mt-0">
          <h1 className="max-w-lg text-5xl font-semibold leading-[0.95] tracking-[-0.03em]">
            Operations,
            <br /> neatly
            <br /> organized.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-6 text-zinc-400">
            Matte, tenang, tanpa distraksi. Dibuat untuk produksi, bukan
            pameran.
          </p>

          {/* TREMOR PREVIEW */}
          <div className="mt-10 grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-zinc-900 !ring-0 border border-zinc-800 rounded-xl">
                <Text className="text-zinc-500 text-xs">Total Revenue</Text>
                <Metric className="text-white text-xl mt-1">Rp 284.5M</Metric>
                <Flex className="mt-3">
                  <Text className="text-xs text-zinc-500">vs last month</Text>
                  <BadgeDelta deltaType="moderateIncrease" size="xs" className="bg-zinc-800 text-zinc-200 ring-0">
                    12.4%
                  </BadgeDelta>
                </Flex>
              </Card>
              <Card className="bg-zinc-900 !ring-0 border border-zinc-800 rounded-xl">
                <Text className="text-zinc-500 text-xs">Active Ops</Text>
                <Metric className="text-white text-xl mt-1">1,010</Metric>
                <div className="mt-3">
                  <BarList
                    data={opsData}
                    color="white"
                    className="text-white [&_span]:text-zinc-300"
                  />
                </div>
              </Card>
            </div>

            <Card className="bg-zinc-900 !ring-0 border border-zinc-800 rounded-xl">
              <Flex>
                <Text className="text-zinc-400 text-xs">Revenue Trend</Text>
                <Text className="text-zinc-500 text-xs font-mono">JAN - JUN 2026</Text>
              </Flex>
              <AreaChart
                className="h-28 mt-4"
                data={chartData}
                index="date"
                categories={["Revenue"]}
                colors={["zinc-400"]}
                showYAxis={false}
                showGridLines={false}
                showLegend={false}
                curveType="monotone"
                showAnimation
              />
            </Card>
          </div>
        </div>

        <div className="hidden justify-between font-mono text-xs text-zinc-500 lg:flex">
          <span>© rdmmoonlight 2026</span>
          <span>COOKIE AUTH • AUMO SYSTEM</span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex flex-col items-center justify-center gap-6 bg-black p-6 lg:p-12">
        <div className="max-w-sm text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Selamat Datang
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Silakan masuk atau buat akun baru untuk mengakses dashboard.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
          <Button
            disabled={checkingAuth}
            onClick={() => handleOpenModal("login")}
            className="flex-1 w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
          >
            {checkingAuth ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            <span>{checkingAuth ? "Checking..." : "Sign In"}</span>
            {!checkingAuth && <ArrowRight className="w-4 h-4" />}
          </Button>
          <Button
            disabled={checkingAuth}
            onClick={() => handleOpenModal("register")}
            variant="outline"
            className="flex-1 w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-lg font-medium text-zinc-100">
                {authMode === "login" ? "Sign In to Aumo" : "Create an Account"}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-4">
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <Suspense fallback={<AuthFormSkeleton />}>
                  {authMode === "login" ? (
                    <LoginPage initialMode="login" onSuccess={handleSuccess} />
                  ) : (
                    <RegisterPage
                      initialMode="register"
                      onSuccess={handleSuccess}
                    />
                  )}
                </Suspense>
              </GoogleOAuthProvider>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
