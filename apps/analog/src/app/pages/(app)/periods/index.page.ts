import { RouteMeta } from "@analogjs/router";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { CreatePeriodDto, Period, PeriodsService } from "./periods.service";

export const routeMeta: RouteMeta = {
  title: "Periode Keuangan - Aumo Finance",
};

@Component({
  selector: "app-periods-page",
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header Page -->
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Periode Keuangan
          </h1>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            Kelola dan pantau siklus anggaran bulanan Anda.
          </p>
        </div>
        <div class="flex gap-2">
          @if (selectedPeriod()) {
            <button
              (click)="clearSelection()"
              [disabled]="isLoading()"
              class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Reset Pilihan
            </button>
          }
          <button
            (click)="openModal.set(true)"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clip-rule="evenodd"
              />
            </svg>
            Tambah Periode
          </button>
        </div>
      </div>

      <!-- Info Banner Periode Terbuka / Aktif -->
      @if (openPeriod()) {
        <div
          class="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200"
        >
          <div>
            <span
              class="block text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400"
            >
              Periode Berjalan
            </span>
            <span class="text-lg font-bold">
              {{ openPeriod()?.periodName }}
            </span>
          </div>
          <button
            (click)="closePeriod(openPeriod()!.id)"
            [disabled]="isLoading()"
            class="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            Tutup Periode Ini
          </button>
        </div>
      }

      <!-- Table Section -->
      <div
        class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div class="overflow-x-auto">
          <table
            class="w-full text-left text-sm text-slate-600 dark:text-slate-300"
          >
            <thead
              class="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300"
            >
              <tr>
                <th scope="col" class="px-6 py-4">Nama Periode</th>
                <th scope="col" class="px-6 py-4">Rentang Waktu</th>
                <th scope="col" class="px-6 py-4">Pemasukan</th>
                <th scope="col" class="px-6 py-4">Pengeluaran</th>
                <th scope="col" class="px-6 py-4">Status</th>
                <th scope="col" class="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
              @if (isLoading()) {
                <tr>
                  <td colspan="6" class="px-6 py-8 text-center text-slate-500">
                    Memuat data periode...
                  </td>
                </tr>
              } @else {
                @for (period of periods(); track period.id) {
                  <tr
                    class="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    [class.bg-brand-50]="period.isSelected"
                  >
                    <td
                      class="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100"
                    >
                      {{ period.periodName }}
                      @if (period.isSelected) {
                        <span
                          class="ml-2 text-xs font-normal text-brand-700 dark:text-brand-400"
                        >
                          (Terpilih)
                        </span>
                      }
                    </td>
                    <td class="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {{ period.startDate }} - {{ period.endDate }}
                    </td>
                    <td
                      class="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      Rp {{ (period.income || 0).toLocaleString("id-ID") }}
                    </td>
                    <td
                      class="px-6 py-4 font-medium text-rose-600 dark:text-rose-400"
                    >
                      Rp {{ (period.expense || 0).toLocaleString("id-ID") }}
                    </td>
                    <td class="px-6 py-4">
                      @if (!period.isClosed) {
                        <span
                          class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-400"
                        >
                          Aktif
                        </span>
                      } @else {
                        <span
                          class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 dark:bg-slate-800 dark:text-slate-400"
                        >
                          Selesai
                        </span>
                      }
                    </td>
                    <td class="space-x-2 px-6 py-4 text-right">
                      <button
                        (click)="selectPeriod(period.id)"
                        [disabled]="period.isSelected"
                        class="font-medium text-brand-700 hover:text-brand-900 hover:underline disabled:text-slate-400 dark:text-brand-400"
                      >
                        Pilih
                      </button>
                      @if (!period.isClosed) {
                        <button
                          (click)="closePeriod(period.id)"
                          class="font-medium text-rose-600 hover:text-rose-800 hover:underline dark:text-rose-400"
                        >
                          Tutup
                        </button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td
                      colspan="6"
                      class="px-6 py-8 text-center text-slate-500"
                    >
                      Belum ada data periode keuangan.
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Form Tambah Periode -->
      @if (openModal()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
        >
          <div
            class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:border dark:border-slate-800 dark:bg-slate-900"
          >
            <div
              class="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800"
            >
              <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100">
                Buat Periode Baru
              </h3>
              <button
                (click)="openModal.set(false)"
                class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="size-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <form
              [formGroup]="form"
              (ngSubmit)="submitForm()"
              class="mt-4 space-y-4"
            >
              <div>
                <label
                  for="periodName"
                  class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Nama Periode
                </label>
                <input
                  id="periodName"
                  type="text"
                  formControlName="periodName"
                  placeholder="Contoh: Oktober 2026"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label
                    for="startDate"
                    class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Tanggal Mulai
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    formControlName="startDate"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label
                    for="endDate"
                    class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Tanggal Selesai
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    formControlName="endDate"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div class="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  (click)="openModal.set(false)"
                  class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  [disabled]="isSubmitting()"
                  class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
                >
                  {{ isSubmitting() ? "Menyimpan..." : "Simpan Periode" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export default class PeriodsPage implements OnInit {
  private readonly periodsService = inject(PeriodsService);
  private readonly fb = inject(FormBuilder);

  readonly periods = signal<Period[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly openModal = signal<boolean>(false);

  // Computed untuk membaca periode aktif / terpilih langsung dari list
  readonly openPeriod = computed(() => this.periods().find((p) => !p.isClosed));
  readonly selectedPeriod = computed(() =>
    this.periods().find((p) => p.isSelected),
  );

  readonly form = this.fb.group({
    periodName: ["", Validators.required],
    startDate: ["", Validators.required],
    endDate: ["", Validators.required],
  });

  ngOnInit(): void {
    this.fetchPeriods();
  }

  fetchPeriods(): void {
    this.isLoading.set(true);
    this.periodsService.getPeriods().subscribe({
      next: (res) => {
        this.periods.set(res || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  submitForm(): void {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    const dto = this.form.getRawValue() as CreatePeriodDto;

    this.periodsService.createPeriod(dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.openModal.set(false);
        this.form.reset();
        this.fetchPeriods();
      },
      error: () => this.isSubmitting.set(false),
    });
  }

  selectPeriod(id: number): void {
    this.periodsService.selectPeriod(id).subscribe({
      next: () => this.fetchPeriods(),
    });
  }

  clearSelection(): void {
    this.periodsService.clearSelection().subscribe({
      next: () => this.fetchPeriods(),
    });
  }

  closePeriod(id: number): void {
    if (!confirm("Apakah Anda yakin ingin menutup periode ini?")) return;

    this.periodsService.closePeriod(id).subscribe({
      next: () => this.fetchPeriods(),
    });
  }
}
