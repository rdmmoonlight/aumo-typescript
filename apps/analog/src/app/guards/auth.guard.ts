import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";

import { AuthService } from "../services/auth.service";

/**
 * Halaman yang wajib login.
 * Web memakai cookie httpOnly (tidak terbaca JS), jadi status login hanya bisa
 * dipastikan lewat GET /auth/me.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.user()) return true;

  return auth.loadSession().pipe(
    map((ok) => (ok ? true : router.parseUrl("/login"))),
    catchError(() => of(router.parseUrl("/login"))),
  );
};

/** Halaman khusus tamu (login/register); user yang sudah login diarahkan ke /home. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.user()) return router.parseUrl("/home");

  return auth.loadSession().pipe(
    map((ok) => (ok ? router.parseUrl("/home") : true)),
    catchError(() => of(true)),
  );
};
