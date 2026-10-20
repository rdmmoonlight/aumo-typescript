import { RouteMeta } from "@analogjs/router";
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { AuthService } from "../../../services/auth.service";
import { Period, PeriodsService } from "../periods/periods.service";

export const routeMeta: RouteMeta = { title: "Home - Aumo Finance" };

@Component({
  selector: "app-home",
  standalone: true,
  template: `
    <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
      Selamat datang, {{ auth.user()?.name || "Pengguna" }}
    </h1>
    <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
      Ringkasan periode akuntansi Anda.
    </p>

    <section class="mt-6 grid gap-4 sm:grid-cols-3">
      <article
        class="rounded-xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-800/60"
      >
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Periode Terpilih
        </p>
        <p
          class="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100"
        >
          {{ selectedName() }}
        </p>
      </article>

      <article
        class="rounded-xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-800/60"
      >
        <p class="text-sm text-slate-500 dark:text-slate-400">Total Periode</p>
        <p
          class="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100"
        >
          {{ periods().length }}
        </p>
      </article>

      <article
        class="rounded-xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-800/60"
      >
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Periode Terbuka
        </p>
        <p
          class="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100"
        >
          {{ openCount() }}
        </p>
      </article>
    </section>

    <section
      class="mt-6 rounded-xl border border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-800/60"
    >
      <h2
        class="border-b border-slate-200 px-5 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100"
      >
        Daftar Periode
      </h2>

      @if (loading()) {
        <p class="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">
          Memuat data...
        </p>
      } @else if (error()) {
        <p class="px-5 py-6 text-sm text-rose-600 dark:text-rose-400">
          {{ error() }}
        </p>
      } @else if (periods().length === 0) {
        <p class="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">
          Belum ada periode. Buat periode pertama Anda.
        </p>
      } @else {
        <ul class="divide-y divide-slate-100 dark:divide-slate-800">
          @for (p of periods(); track p.id) {
            <li class="flex items-center justify-between px-5 py-3 text-sm">
              <span class="font-medium text-slate-800 dark:text-slate-200">
                {{ p.periodName }}
              </span>
              <span class="flex items-center gap-2">
                @if (p.isSelected) {
                  <span
                    class="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800 dark:bg-brand-900/60 dark:text-brand-300"
                  >
                    Dipilih
                  </span>
                }
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  [class]="
                    p.isClosed
                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
                  "
                >
                  {{ p.isClosed ? "Ditutup" : "Terbuka" }}
                </span>
              </span>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export default class HomePage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly periodsService = inject(PeriodsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly periods = signal<Period[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly openCount = computed(
    () => this.periods().filter((p) => !p.isClosed).length,
  );

  readonly selectedName = computed(() => {
    const selected = this.periods().find((p) => p.isSelected);
    return selected?.periodName ?? "-";
  });

  ngOnInit(): void {
    this.fetchPeriods();
  }

  fetchPeriods(): void {
    this.periodsService
      .getPeriods()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          // Akses property array dari GetPeriodsResponse (misal: res.data)
          this.periods.set(res?.data || []);
          this.loading.set(false);
        },
        error: () => {
          this.error.set("Data periode gagal dimuat.");
          this.loading.set(false);
        },
      });
  }
}
