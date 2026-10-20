import { Component, computed, inject, output } from "@angular/core";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-top-bar",
  standalone: true,
  template: `
    <header
      class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 transition-colors dark:border-slate-800 dark:bg-slate-900/95 dark:backdrop-blur sm:px-6"
    >
      <button
        type="button"
        class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        (click)="openMenu.emit()"
        aria-label="Buka menu"
      >
        <svg
          class="size-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <span
        class="hidden text-sm font-semibold text-slate-700 dark:text-slate-200 lg:block"
        >Aumo Finance</span
      >

      <div class="flex items-center gap-3">
        <div class="text-right leading-tight">
          <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {{ auth.user()?.name }}
          </p>
          <p class="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
            {{ auth.user()?.email }}
          </p>
        </div>
        <span
          class="flex size-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800 dark:bg-brand-900/60 dark:text-brand-300"
        >
          {{ initial() }}
        </span>
      </div>
    </header>
  `,
})
export class TopBarComponent {
  readonly auth = inject(AuthService);

  openMenu = output<void>();

  readonly initial = computed(() =>
    (this.auth.user()?.name?.trim()[0] ?? "?").toUpperCase(),
  );
}
