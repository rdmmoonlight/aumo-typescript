import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, catchError, map, of, switchMap, tap } from "rxjs";

import {
  AuthResponse,
  AuthUser,
  LoginPayload,
  MeResponse,
  RegisterPayload,
} from "@app/contracts";
import { API_URL } from "../core/config";

const USER_NAME_KEY = "aumo_user_fullname";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly user = signal<AuthUser | null>(null);

  /** K1 & K2: Login dengan client: "web" dan pembacaan res.data */
  login(payload: Omit<LoginPayload, "client">): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, {
        ...payload,
        client: "web",
      })
      .pipe(
        tap((res) => {
          if (res.data) {
            this.user.set(res.data);
            if (res.data.name) {
              localStorage.setItem(USER_NAME_KEY, res.data.name);
            }
          }
        })
      );
  }

  /** K4: Register otomatis memanggil login untuk mendapatkan cookie sesi */
  register(payload: Omit<RegisterPayload, "client">): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/register`, {
        ...payload,
        client: "web",
      })
      .pipe(
        switchMap(() =>
          this.login({
            email: payload.email,
            password: payload.password,
          })
        )
      );
  }

  /** K3: Petakan klaim JWT dari /auth/me ke model AuthUser & ambil nama dari storage */
  loadSession(): Observable<boolean> {
    return this.http.get<MeResponse>(`${API_URL}/auth/me`).pipe(
      map((res) => {
        if (res.data) {
          const savedName = localStorage.getItem(USER_NAME_KEY) ?? "";
          this.user.set({
            id: res.data.user_id,
            email: res.data.email,
            name: savedName,
          });
        }
        return !!res.data;
      }),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  logout(): void {
    const done = () => {
      this.clearSession();
      void this.router.navigateByUrl("/login");
    };
    this.http
      .post(`${API_URL}/auth/logout`, {})
      .subscribe({ next: done, error: done });
  }

  clearSession(): void {
    this.user.set(null);
    localStorage.removeItem(USER_NAME_KEY);
  }
}

/** Ambil pesan error dari format { success: false, message, errors } milik backend. */
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
