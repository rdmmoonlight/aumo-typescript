// src/app/routes.ts
import { Routes } from "@angular/router";

import { authGuard, guestGuard } from "../guards/auth.guard";

export const routes: Routes = [
  // Rute Root / Beranda Utama
  {
    path: "",
    loadComponent: () => import("../pages/index.page").then((m) => m.default),
  },

  // Rute Auth (dengan Layout Parent `(auth).page.ts`)
  {
    path: "",
    canActivate: [guestGuard],
    loadComponent: () =>
      import("../pages/(auth)/(auth).page").then((m) => m.default),
    children: [
      {
        path: "login",
        loadComponent: () =>
          import("../pages/(auth)/login.page").then((m) => m.default),
      },
      {
        path: "register",
        loadComponent: () =>
          import("../pages/(auth)/register.page").then((m) => m.default),
      },
    ],
  },

  // Rute App (dengan Layout Parent `(app).page.ts`)
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () => import("../pages/(app).page").then((m) => m.default),
    children: [
      {
        path: "home",
        loadComponent: () =>
          import("../pages/(app)/home/index.page").then((m) => m.default),
      },
    ],
  },
];
