import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, catchError, map, of, tap } from "rxjs";

import { API_URL } from "../core/config";
import {
  AuthResponse,
  AuthUser,
  LoginPayload,
  MeResponse,
  RegisterPayload,
} from "../models/auth.models";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly user = signal<AuthUser | null>(null);

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, {
        ...payload,
        clientType: "web",
      })
      .pipe(tap((res) => this.user.set(res.user)));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/register`, {
        ...payload,
        clientType: "web",
      })
      .pipe(tap((res) => this.user.set(res.user)));
  }

  /** Cek sesi aktif ke backend (cookie). true = sudah login. */
  loadSession(): Observable<boolean> {
    return this.http.get<MeResponse>(`${API_URL}/auth/me`).pipe(
      map((res) => {
        this.user.set(res.data?.user ?? null);
        return !!res.data?.user;
      }),
      catchError(() => {
        this.user.set(null);
        return of(false);
      }),
    );
  }

  logout(): void {
    const done = () => {
      this.user.set(null);
      void this.router.navigateByUrl("/login");
    };
    this.http
      .post(`${API_URL}/auth/logout`, {})
      .subscribe({ next: done, error: done });
  }

  clearSession(): void {
    this.user.set(null);
  }
}

/** Ambil pesan error dari format { success:false, message, errors } milik backend. */
export function extractError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0)
      return "Server tidak dapat dihubungi. Periksa koneksi Anda.";
    const body = err.error as {
      message?: string;
      errors?: Record<string, string[]>;
    } | null;
    const firstField = body?.errors
      ? Object.values(body.errors).flat()[0]
      : undefined;
    return (
      firstField ?? body?.message ?? "Terjadi kesalahan. Silakan coba lagi."
    );
  }
  return "Terjadi kesalahan. Silakan coba lagi.";
}
