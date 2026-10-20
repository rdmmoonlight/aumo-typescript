import { RouteMeta } from "@analogjs/router";
import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";

import { guestGuard } from "../../guards/auth.guard";
import { Logo } from "../../shared/logo";

export const routeMeta: RouteMeta = { canActivate: [guestGuard] };

/** Layout halaman tamu: /login dan /register */
@Component({
  selector: "app-auth-layout",
  imports: [RouterOutlet, RouterLink, Logo],
  template: `
    <div
      class="flex min-h-screen flex-col items-center justify-center px-4 py-10"
    >
      <a routerLink="/" class="mb-6"><app-logo /></a>
      <div
        class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <router-outlet />
      </div>
    </div>
  `,
})
export default class AuthLayout {}
