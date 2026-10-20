import { RouteMeta } from "@analogjs/router";
import { Component, inject, signal } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";

import { AuthService, extractError } from "../../services/auth.service";

export const routeMeta: RouteMeta = { title: "Daftar - Aumo Finance" };

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const p = group.get("password")?.value;
  const c = group.get("confirmPassword")?.value;
  return p && c && p !== c ? { mismatch: true } : null;
}

@Component({
  selector: "app-register",
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1 class="text-xl font-bold text-slate-900">Buat Akun</h1>
    <p class="mt-1 text-sm text-slate-600">
      Daftar untuk mulai mengelola keuangan Anda.
    </p>

    @if (error()) {
      <div
        role="alert"
        class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ error() }}
      </div>
    }

    <form
      [formGroup]="form"
      (ngSubmit)="submit()"
      class="mt-6 space-y-4"
      novalidate
    >
      <div>
        <label for="name" class="mb-1 block text-sm font-medium text-slate-700"
          >Nama Lengkap</label
        >
        <input
          id="name"
          type="text"
          formControlName="name"
          autocomplete="name"
          class="input"
        />
        @if (invalid("name")) {
          <p class="mt-1 text-xs text-red-600">Nama wajib diisi.</p>
        }
      </div>

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
          autocomplete="new-password"
          class="input"
        />
        @if (invalid("password")) {
          <p class="mt-1 text-xs text-red-600">
            Kata sandi minimal 8 karakter.
          </p>
        }
      </div>

      <div>
        <label
          for="confirmPassword"
          class="mb-1 block text-sm font-medium text-slate-700"
          >Konfirmasi Kata Sandi</label
        >
        <input
          id="confirmPassword"
          type="password"
          formControlName="confirmPassword"
          autocomplete="new-password"
          class="input"
        />
        @if (
          form.hasError("mismatch") && form.controls.confirmPassword.touched
        ) {
          <p class="mt-1 text-xs text-red-600">
            Konfirmasi kata sandi tidak sama.
          </p>
        }
      </div>

      <button type="submit" class="btn-primary w-full" [disabled]="loading()">
        {{ loading() ? "Memproses..." : "Daftar" }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-600">
      Sudah punya akun?
      <a
        routerLink="/login"
        class="font-semibold text-brand-700 hover:underline"
        >Masuk</a
      >
    </p>
  `,
})
export default class RegisterPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group(
    {
      name: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(8)]],
      confirmPassword: ["", Validators.required],
    },
    { validators: passwordsMatch },
  );

  invalid(name: "name" | "email" | "password"): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { name, email, password } = this.form.getRawValue();
    this.auth.register({ name, email, password }).subscribe({
      next: () => void this.router.navigateByUrl("/home"),
      error: (err) => {
        this.error.set(extractError(err));
        this.loading.set(false);
      },
    });
  }
}
