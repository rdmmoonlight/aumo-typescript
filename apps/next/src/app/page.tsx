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
  Text,
  Flex,
  Badge,
  List,
  ListItem,
} from "@tremor/react";

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
            Matte, tenang, tanpa distraksi. Dibuat untuk produksi, bukan pameran.
          </p>

          {/* TREMOR - Informasi yang sudah ada jadi kotak */}
          <Card className="mt-10 bg-zinc-900 border border-zinc-800 !ring-0 rounded-xl p-0 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <Flex justifyContent="between" alignItems="center">
                <Text className="text- tracking-[0.2em] text-zinc-500 uppercase">
                  Core Modules
                </Text>
                <Badge size="xs" color="zinc" className="bg-zinc-800 text-zinc-400 ring-0 border border-zinc-700">
                  3 SYSTEMS
                </Badge>
              </Flex>
            </div>
            <List className="mt-0">
              <ListItem className="border-zinc-800 py-4 px-4 hover:bg-zinc-800/50 transition">
                <Flex justifyContent="start" className="gap-4">
                  <span className="font-mono text-xs text-zinc-500">01</span>
                  <Text className="text-sm text-white font-medium">Revenues & Expenses</Text>
                </Flex>
                <Badge size="xs" className="bg-white text-black ring-0">Active</Badge>
              </ListItem>
              <ListItem className="border-zinc-800 py-4 px-4 hover:bg-zinc-800/50 transition">
                <Flex justifyContent="start" className="gap-4">
                  <span className="font-mono text-xs text-zinc-500">02</span>
                  <Text className="text-sm text-white font-medium">Tracking</Text>
                </Flex>
                <Text className="text-xs text-zinc-500">Realtime</Text>
              </ListItem>
              <ListItem className="border-zinc-800 border-b-0 py-4 px-4 hover:bg-zinc-800/50 transition">
                <Flex justifyContent="start" className="gap-4">
                  <span className="font-mono text-xs text-zinc-500">03</span>
                  <Text className="text-sm text-white font-medium">Finance & Costings</Text>
                </Flex>
                <Text className="text-xs text-zinc-500">Secure</Text>
              </ListItem>
            </List>
          </Card>
        </div>

        <div className="hidden justify-between font-mono text-xs text-zinc-500 lg:flex">
          <span>© rdmmoonlight 2026</span>
          <span>COOKIE AUTH • AUMO SYSTEM</span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex flex-col items-center justify-center gap-6 bg-black p-6 lg:p-12">
        <Card className="w-full max-w-sm bg-zinc-950 border border-zinc-800 !ring-0 rounded-2xl p-6">
          <div className="text-center">
            <Badge size="xs" color="zinc" className="mb-3 bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800">
              AUMO ACCESS
            </Badge>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Selamat Datang
            </h2>
            <Text className="mt-2 text-sm text-zinc-400">
              Silakan masuk atau buat akun baru untuk mengakses dashboard.
            </Text>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full">
            <Button
              disabled={checkingAuth}
              onClick={() => handleOpenModal("login")}
              className="flex-1 w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
            >
              {checkingAuth ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>{checkingAuth ? "Checking..." : "Sign In"}</span>
              {!checkingAuth && <ArrowRight className="w-4 h-4" />}
            </Button>
            <Button
              disabled={checkingAuth}
              onClick={() => handleOpenModal("register")}
              variant="outline"
              className="flex-1 w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </Button>
          </div>
        </Card>

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
                    <RegisterPage initialMode="register" onSuccess={handleSuccess} />
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
