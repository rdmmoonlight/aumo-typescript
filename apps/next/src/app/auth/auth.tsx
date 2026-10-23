"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleLogin } from "@react-oauth/google";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { baseApi } from "@/lib/apiClient";
import { store } from "@/lib/store";
import { authApi } from "@/lib/store/auth/authApi";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

// ===== TYPES =====
export type AuthFormData = {
  fullName?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  keepMe?: boolean;
};

export interface AuthPageProps {
  initialMode?: "login" | "register";
  onSuccess?: () => void;
}

export const GOOGLE_CLIENT_ID: string =
  process.env.NEXT_PUBLIC__GOOGLE_CLIENT_ID ||
  process.env.NEXT_PUBLIC__NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "";

export function GoogleIcon(
  props: React.ComponentProps<"svg">,
): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={props.className ?? "h-4 w-4"}
      {...props}
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function GoogleAuthButtonInner({
  isPending,
  onSuccessHandler,
  onError,
}: {
  isPending: boolean;
  onSuccessHandler: (idToken: string) => void;
  onError: (msg: string) => void;
}): React.JSX.Element {
  const googleLogin = useGoogleLogin({
    onSuccess: (res) => {
      if (res.access_token) onSuccessHandler(res.access_token);
      else onError("Gagal mendapatkan token dari Google.");
    },
    onError: () => onError("Autentikasi Google dibatalkan."),
  });

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        if (!GOOGLE_CLIENT_ID) {
          onError("NEXT_PUBLIC__GOOGLE_CLIENT_ID belum diset");
          return;
        }
        googleLogin();
      }}
      className="h-11 w-full rounded-xl border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
    >
      <GoogleIcon className="mr-2 h-4 w-4" /> Continue with Google
    </Button>
  );
}

export function AuthFormSkeleton(): React.JSX.Element {
  return (
    <div className="flex h-80 w-full max-w-sm animate-pulse items-center justify-center rounded-2xl border bg-white p-6">
      <p className="text-sm text-zinc-400">Loading workspace...</p>
    </div>
  );
}

function AuthFormInner({
  initialMode = "login",
  onSuccess,
}: AuthPageProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [apiErr, setApiErr] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(mode === "login" ? loginSchema : registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      keepMe: false,
    },
  });

  const keepMeValue = watch("keepMe");

  // Cek profil user saat pertama kali dimuat
  useEffect(() => {
    let isMounted = true;

    async function checkAuthProfile() {
      try {
        const result = await store.dispatch(
          authApi.endpoints.getProfile.initiate(),
        );

        if (isMounted && "data" in result && result.data?.success) {
          if (onSuccess) {
            onSuccess();
          } else {
            const target = searchParams.get("redirectTo") || "/home";
            window.location.replace(target);
          }
        }
      } catch {
        // Mengabaikan error jika belum terautentikasi
      } finally {
        if (isMounted) setIsProfileLoading(false);
      }
    }

    checkAuthProfile();

    return () => {
      isMounted = false;
    };
  }, [searchParams, onSuccess]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const saved = localStorage.getItem("aumo_saved_email");
    if (saved && mode === "login") {
      setValue("email", saved);
      setValue("keepMe", true);
    }
  }, [setValue, mode]);

  const handleSwitchMode = (newMode: "login" | "register"): void => {
    setApiErr("");
    setMode(newMode);
    const saved = localStorage.getItem("aumo_saved_email");
    reset({
      fullName: "",
      email: newMode === "login" && saved ? saved : "",
      password: "",
      confirmPassword: "",
      keepMe: newMode === "login" && !!saved,
    });
  };

  const handleRedirectOrSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      const target = searchParams.get("redirectTo") || "/home";
      window.location.replace(target);
    }
  };

  const onSubmit: SubmitHandler<AuthFormData> = async (values) => {
    setApiErr("");
    setIsPending(true);

    try {
      // Reset cache RTK Query
      dispatch(baseApi.util.resetApiState());

      if (mode === "register") {
        // Executing Register Mutation
        const registerResult = await store.dispatch(
          authApi.endpoints.register.initiate({
            fullName: values.fullName || "",
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
            isMobileClient: false,
          }),
        );

        if ("error" in registerResult) {
          const errorData = registerResult.error as any;
          const msg =
            errorData?.data?.message ||
            errorData?.data?.errors?.[0] ||
            "Pendaftaran gagal. Silakan coba lagi.";
          setApiErr(msg);
          return;
        }

        // Auto Login setelah registrasi berhasil
        const loginResult = await store.dispatch(
          authApi.endpoints.login.initiate({
            email: values.email,
            password: values.password,
            rememberMe: false,
            isMobileClient: false,
          }),
        );

        if ("error" in loginResult) {
          // Jika backend tidak langsung mengembalikan session login pada register,
          // alihkan pengguna ke tampilan login
          setMode("login");
          reset({ email: values.email, password: "" });
          return;
        }

        handleRedirectOrSuccess();
      } else {
        // Executing Login Mutation
        const result = await store.dispatch(
          authApi.endpoints.login.initiate({
            email: values.email,
            password: values.password,
            rememberMe: values.keepMe ?? false,
            isMobileClient: false,
          }),
        );

        if ("error" in result) {
          const errorData = result.error as any;
          const msg =
            errorData?.data?.message ||
            errorData?.data?.title ||
            (errorData?.status === "FETCH_ERROR"
              ? "Gagal terhubung ke server backend."
              : "Email atau password salah.");
          setApiErr(msg);
          return;
        }

        if (values.keepMe) {
          localStorage.setItem("aumo_saved_email", values.email);
        } else {
          localStorage.removeItem("aumo_saved_email");
        }

        handleRedirectOrSuccess();
      }
    } catch {
      setApiErr("Terjadi kesalahan sistem saat memproses permintaan.");
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogleSuccess = async (idToken: string): Promise<void> => {
    setApiErr("");
    setIsPending(true);

    try {
      dispatch(baseApi.util.resetApiState());

      const result = await store.dispatch(
        authApi.endpoints.googleLogin.initiate({
          idToken,
          isMobileClient: false,
        }),
      );

      if ("error" in result) {
        const errorData = result.error as any;
        setApiErr(errorData?.data?.message || "Gagal verifikasi Google.");
        return;
      }

      handleRedirectOrSuccess();
    } catch {
      setApiErr("Gagal verifikasi Google.");
    } finally {
      setIsPending(false);
    }
  };

  if (isProfileLoading) return <AuthFormSkeleton />;

  return (
    <div className="light w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 text-black shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          {mode === "login" ? "Sign in" : "Create account"}
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          {mode === "login"
            ? "Masuk ke workspace kamu."
            : "Daftar untuk membuat workspace baru."}
        </p>
      </div>

      <div className="space-y-4">
        <GoogleAuthButtonInner
          isPending={isPending}
          onSuccessHandler={handleGoogleSuccess}
          onError={setApiErr}
        />
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-zinc-200" />
          <span className="absolute bg-white px-2 font-mono text-[10px] uppercase text-zinc-400">
            OR
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        {mode === "register" && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase">
              Nama Lengkap
            </Label>
            <Input
              {...register("fullName")}
              placeholder="Nama Anda"
              className="h-11 rounded-xl bg-zinc-50"
            />
            {errors.fullName && (
              <p className="text-xs text-red-600">
                {errors.fullName.message}
              </p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase">Email</Label>
          <Input
            {...register("email")}
            placeholder="nama@email.com"
            className="h-11 rounded-xl bg-zinc-50"
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label className="text-xs font-semibold uppercase">Password</Label>
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="text-xs text-zinc-600"
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
          <Input
            {...register("password")}
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            className="h-11 rounded-xl bg-zinc-50"
          />
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {mode === "register" && (
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label className="text-xs font-semibold uppercase">
                Confirm Password
              </Label>
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="text-xs text-zinc-600"
              >
                {showConfirmPass ? "Hide" : "Show"}
              </button>
            </div>
            <Input
              {...register("confirmPassword")}
              type={showConfirmPass ? "text" : "password"}
              placeholder="••••••••"
              className="h-11 rounded-xl bg-zinc-50"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        )}

        {mode === "login" && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={keepMeValue}
                onCheckedChange={(v) => setValue("keepMe", v === true)}
              />
              <Label className="text-xs">Keep me signed in</Label>
            </div>
            <a href="#" className="text-xs underline">
              Forgot?
            </a>
          </div>
        )}

        {apiErr && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-600">
            {apiErr}
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="h-11 w-full rounded-xl bg-black text-white hover:bg-zinc-800"
        >
          {isPending
            ? "Processing..."
            : mode === "login"
              ? "Sign In"
              : "Create Account"}
        </Button>
      </form>

      <div className="mt-5 text-center text-xs text-zinc-600">
        {mode === "login" ? (
          <>
            Belum punya akun?{" "}
            <button
              onClick={() => handleSwitchMode("register")}
              className="font-semibold underline"
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            Sudah punya akun?{" "}
            <button
              onClick={() => handleSwitchMode("login")}
              className="font-semibold underline"
            >
              Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthForm(props: AuthPageProps): React.JSX.Element {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <AuthFormInner {...props} />
    </Suspense>
  );
}