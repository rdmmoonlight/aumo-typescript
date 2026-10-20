import { isPlatformBrowser } from "@angular/common";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject, PLATFORM_ID } from "@angular/core";
import { CanActivateFn } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { API_URL } from "./config";

export const pingGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);

  // Skip ping jika berjalan di SSR/Server
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const http = inject(HttpClient);
  
  // Clean base URL agar tidak ada trailing slash ganda
  const cleanBaseUrl = API_URL.replace(/\/+$/, "");
  const pingUrl = `${cleanBaseUrl}/api/health?_t=${Date.now()}`;

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
