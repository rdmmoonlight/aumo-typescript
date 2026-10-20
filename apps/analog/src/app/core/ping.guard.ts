import { isPlatformBrowser } from "@angular/common";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject, PLATFORM_ID } from "@angular/core";
import { CanActivateFn } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { API_URL } from "./config";

export const pingGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);

  // Jika sedang berjalan di SSR/Server Build, skip ping
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const http = inject(HttpClient);
  const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;

  // Tambahkan query param timestamp agar URL selalu unik (membendung HTTP cache)
  const pingUrl = `${baseUrl}?_t=${Date.now()}`;

  // Tambahkan header anti-cache
  const headers = new HttpHeaders({
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });

  return http.get(pingUrl, { headers }).pipe(
    map(() => true),
    catchError(() => of(true)),
  );
};
