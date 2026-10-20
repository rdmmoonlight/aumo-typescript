import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";

import { API_URL } from "../core/config";
import { AuthService } from "../services/auth.service";

/** Kirim cookie sesi ke backend & arahkan ke /login saat sesi berakhir (401). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) return next(req);

  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuthCall = /\/auth\/(login|register|me)$/.test(req.url);

  return next(req.clone({ withCredentials: true })).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        !isAuthCall
      ) {
        auth.clearSession();
        void router.navigateByUrl("/login");
      }
      return throwError(() => err);
    }),
  );
};
