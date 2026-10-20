import { RouteMeta } from "@analogjs/router";
import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AuthStore } from "../../store/auth.store";

export const routeMeta: RouteMeta = { title: "Masuk - Aumo Finance" };

@Component({
  selector: "app-login",
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1 class="text-xl font-bold text-slate-900">Masuk</h1>
    <p class="mt-1 text-sm text-slate-600">
      Gunakan email dan kata sandi akun Anda.
    </p>

    @if (store.error()) {
      <div
        role="alert"
        class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ store.error() }}
      </div>
    }

    <form
      [formGroup]="form"
      (ngSubmit)="submit()"
      class="mt-6 space-y-4"
      novalidate
    >
      <div>
        <label for="email" class="mb-1 block text-sm font-medium text-slate-700"
          >Email</label
        >
        <input
          id="email"
          type="email"
          formControlName="email"
          autocomplete="email"
          class="input"
          placeholder="nama@email.com"
        />
        @if (invalid("email")) {
          <p class="mt-1 text-xs text-red-600">
            Masukkan alamat email yang valid.
          </p>
        }
      </div>

      <div>
        <label
          for="password"
          class="mb-1 block text-sm font-medium text-slate-700"
          >Kata Sandi</label
        >
        <input
          id="password"
          type="password"
          formControlName="password"
          autocomplete="current-password"
          class="input"
        />
        @if (invalid("password")) {
          <p class="mt-1 text-xs text-red-600">Kata sandi wajib diisi.</p>
        }
      </div>

      <label class="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          formControlName="rememberMe"
          class="size-4 rounded border-slate-300 accent-brand-700"
        />
        Ingat saya
      </label>

      <button
        type="submit"
        class="btn-primary w-full"
        [disabled]="store.isLoading()"
      >
        {{ store.isLoading() ? "Memproses..." : "Masuk" }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-600">
      Belum punya akun?
      <a
        routerLink="/register"
        class="font-semibold text-brand-700 hover:underline"
        >Daftar</a
      >
    </p>
  `,
})
export default class LoginPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly store = inject(AuthStore);

  readonly form = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", Validators.required],
    rememberMe: [true],
  });

  invalid(name: "email" | "password"): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.login(this.form.getRawValue());
  }
}
