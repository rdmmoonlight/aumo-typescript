import { RouteMeta } from "@analogjs/router";
import { Component, signal } from "@angular/core";
import { RouterOutlet } from "@angular/router";

import { NavItem, SidebarComponent } from "../components/sidebar.component";
import { TopBarComponent } from "../components/top-bar.component";
import { authGuard } from "../guards/auth.guard";

export const routeMeta: RouteMeta = { canActivate: [authGuard] };

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopBarComponent],
  template: `
    <div
      class="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-900 dark:text-slate-100"
    >
      <!-- Sidebar -->
      <app-sidebar
        [open]="open()"
        [nav]="nav"
        (closeSidebar)="open.set(false)"
      />

      <!-- Area Konten Utama -->
      <div class="lg:pl-64">
        <!-- Top Bar -->
        <app-top-bar (openMenu)="open.set(true)" />

        <!-- Router Outlet tempat merender child pages -->
        <main class="p-4 sm:p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export default class AppShell {
  readonly open = signal(false);

  readonly nav: NavItem[] = [
    { label: "Beranda", path: "/home", icon: "home" },
    { label: "Periode", path: "/periods", icon: "calendar" },
    { label: "Bagan Akun", icon: "list" },
    { label: "Jurnal Umum", icon: "book" },
  ];
}
