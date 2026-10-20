import { Component, inject, input, output } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { Icon, IconName } from "../shared/icon";
import { Logo } from "../shared/logo";

export interface NavItem {
  label: string;
  path?: string;
  icon: IconName;
}

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Logo, Icon],
  template: `
    <!-- Overlay Mobile -->
    @if (open()) {
      <div
        class="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        (click)="closeSidebar.emit()"
      ></div>
    }

    <!-- Sidebar Aside -->
    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-900 text-brand-100 transition-transform dark:bg-slate-950 lg:translate-x-0 dark:border-r dark:border-slate-800"
      [class.-translate-x-full]="!open()"
    >
      <div class="flex h-16 items-center px-5">
        <app-logo [light]="true" />
      </div>

      <nav
        class="flex-1 space-y-1 overflow-y-auto px-3 py-4"
        aria-label="Menu utama"
      >
        @for (item of nav(); track item.label) {
          @if (item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-brand-700 text-white dark:bg-brand-600"
              (click)="closeSidebar.emit()"
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-brand-800 dark:hover:bg-slate-800"
            >
              <app-icon [name]="item.icon" />
              {{ item.label }}
            </a>
          } @else {
            <span
              class="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium opacity-50"
            >
              <app-icon [name]="item.icon" />
              {{ item.label }}
              <span
                class="ml-auto rounded bg-brand-800 px-1.5 py-0.5 text-[10px] uppercase dark:bg-slate-800"
                >Segera</span
              >
            </span>
          }
        }
      </nav>

      <div class="border-t border-brand-800 p-3 dark:border-slate-800">
        <button
          type="button"
          (click)="auth.logout()"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-brand-800 dark:hover:bg-slate-800"
        >
          <svg
            class="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Keluar
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly auth = inject(AuthService);

  open = input<boolean>(false);
  nav = input<NavItem[]>([]);

  closeSidebar = output<void>();
}
