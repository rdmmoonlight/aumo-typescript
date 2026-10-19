# Peta Migrasi: `/nest` (aumo-finance) → `apps/nest` (aumo_typescript)

> Status: **PEMETAAN SAJA.** Dokumen ini tidak memindahkan atau mengubah kode apa pun.
> Sumber: `github.com/rdmmoonlight/aumo-finance`, folder `/nest` (NestJS 11 + Better Auth + Drizzle).
> Tujuan: `github.com/rdmmoonlight/aumo_typescript` (monorepo pnpm + Nx).

---

## 1. Ringkasan Keputusan

| Pos | Keputusan |
| --- | --- |
| Folder tujuan | `apps/nest`, nama paket `@app/nest` (cocok dengan `pnpm-workspace.yaml`: `apps/*`) |
| `apps/api` (tes mock) | Tetap. Bukan bagian migrasi ini |
| `services/auth` (Go) | **Titik keputusan Fase 1.** Better Auth di Nest dan layanan auth Go (ADR 0006) tumpang tindih. Tidak ada yang dihapus sebelum ADR baru |
| Node | Naik ke **24** (syarat `engines` Nest). Berdampak ke 4 workflow |
| pnpm | Tetap `9.15.9` (`packageManager`). Lockfile Nest tidak dipakai, dibuat ulang di lockfile root |
| Zod | Nest memakai v4, `libs/contracts` memakai v3. Diselaraskan di Fase 7, bukan sebelumnya |
| Biaya | Nol tambahan. Semua alat gratis (GitHub Actions, Render free tier, Neon) |
| Aturan | CI wajib hijau di setiap akhir fase. Tidak ada fase yang boleh merusak workflow yang sudah lolos |

## 2. Inventaris Baseline (`/nest`)

| Kelompok | Isi |
| --- | --- |
| Modul | `health`, `auth` (controller, service, schemas), `periods` (controller, service 594 baris) |
| Lapisan umum | `common/` (guard auth, rate limit, filter exception, pipe zod, 3 middleware), `config/cors.ts`, `app.setup.ts` |
| Infrastruktur | `lib/` (`env`, `auth` Better Auth, `db` Drizzle + `pg`, `redis`, `queue` BullMQ, `logger` pino, `errors`) |
| Skema DB | `src/db/schema/` (auth, chart-of-accounts, general-journal, periods, transaction-counters) + `drizzle/` (migrasi `0000` dan artefak `db:pull`) |
| Tes | `src/test/` (8 file termasuk `setup.ts` dan helper; nama **bukan** `*.test.ts`), memakai `setup.ts` yang me-mock Redis dan Better Auth |
| Deploy | `Dockerfile` 2 tahap (`node:24`), `.env.example` (17 variabel) |
| Total | 67 file terlacak |

## 3. Benturan Konfigurasi (Nest vs Repo Tujuan)

| Aspek | `/nest` | `aumo_typescript` (sekarang) | Dampak dan penanganan |
| --- | --- | --- | --- |
| Node | `>=24` | CI Node 20, `engines >=20` | CI dan `engines` dinaikkan ke 24 (Fase 2) |
| pnpm build script | `allowBuilds` (sintaks pnpm 10) di `pnpm-workspace.yaml` | pnpm 9: `pnpm.onlyBuiltDependencies: []` | Pindahkan ke `onlyBuiltDependencies`: `bcrypt`, `esbuild`, `msgpackr-extract`, `@scarf/scarf`, `nx` |
| Zod | `^4.6.5` (`z.treeifyError`) | `^3.23` di `libs/contracts` | Dua versi hidup berdampingan per paket sampai Fase 7 |
| pino | `^10` | `^9` di `libs/logger` | Logger Nest tetap lokal sampai Fase 7 |
| ESLint | `^10` + `@typescript-eslint` | `^9`, hanya JS inti | Lint Nest dijalankan per paket (target Nx), root mengabaikan `apps/nest` |
| Vitest | `^3`, `include: src/test/**`, `setupFiles` | `^1`, `include: **/*.{test,spec}.ts` | Root harus mengecualikan `apps/nest`, supaya `periods.service.spec.ts` tidak jalan tanpa setup |
| TypeScript | `module: Node16`, `experimentalDecorators`, `emitDecoratorMetadata` | `NodeNext` strict + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` | `tsc --noEmit` di root akan gagal pada dekorator. Root mengecualikan `apps/nest`, Nest punya `tsconfig` sendiri |
| Skrip root | `lint`, `typecheck`, `test` langsung | idem | Diganti `nx run-many -t <target>` agar tiap paket memakai konfigurasinya sendiri |
| Lockfile | `nest/pnpm-lock.yaml` | `pnpm-lock.yaml` root | Lockfile Nest dibuang, lockfile root dibuat ulang |
| `pnpm deploy` | Tidak dipakai | Perlu untuk Docker | Paket Nest wajib punya `"files": ["dist"]`, jika tidak `dist/` (ada di `.gitignore`) tidak ikut tersalin |

## 4. Fase Migrasi (9 Fase)

### Fase 1 — Baseline & Keputusan

- [x] Bekukan perubahan baru di `/nest` selama migrasi.
- [x] Putuskan nasib `services/auth` (Go): dipertahankan, atau digantikan Better Auth di Nest.
- [x] Catat keputusan di `docs/adr/0007-nest-masuk-monorepo.md`.
- [x] **Keluaran:** ADR 0007. **Selesai bila:** auth authority tunggal sudah ditetapkan tertulis.

### Fase 2 — Penyelarasan Toolchain Root (belum ada kode Nest)

- [x] `package.json`: `engines.node` → `>=24.0.0`; `pnpm.onlyBuiltDependencies` diisi (lihat bagian 3).
- [x] `ci.yml`, `polyglot-ci.yml`, `release.yml`, `dependency-rules.yml`: `node-version: 24`.
- [x] `tsconfig.json` root: `exclude` ditambah `apps/nest`.
- [x] `vitest.config.ts` root: `exclude` ditambah `apps/nest/**`.
- [x] `eslint.config.mjs` root: `ignores` ditambah `apps/nest/**`.
- [x] Skrip root `lint`, `typecheck`, `test` → `nx run-many -t <target>`; tambah target `lint`, `typecheck`, `test` di `apps/api` dan `libs/*` agar tetap tercakup.
- [ ] **Keluaran:** CI hijau di Node 24. **Selesai bila:** 3 workflow lolos tanpa perubahan fungsional.

### Fase 3 — Salin Kode ke `apps/nest`

- [ ] Salin `src/`, `drizzle/`, `drizzle.config.ts`, `nest-cli.json`, `tsconfig*.json`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc`, `.env.example`.
- [ ] **Jangan** salin `pnpm-lock.yaml` dan `pnpm-workspace.yaml` milik Nest.
- [ ] `package.json`: nama `aumone` → `@app/nest`, tambah `"private": true` dan `"files": ["dist"]`.
- [ ] Ganti skrip `prebuild`/`prestart` yang memanggil `pnpm run clean` bila bentrok dengan Nx; pertahankan `clean`.
- [ ] `pnpm install` di root → `pnpm-lock.yaml` baru, lalu `pnpm install --frozen-lockfile` harus lolos.
- [ ] **Keluaran:** `apps/nest` ada di workspace. **Selesai bila:** `pnpm --filter @app/nest build` berhasil lokal.

### Fase 4 — Gerbang Mutu Nest di CI

- [ ] Target Nx `lint`, `typecheck`, `test`, `build` untuk `@app/nest` berjalan di `ci.yml`.
- [ ] Tes memakai `src/test/setup.ts` (mock Redis dan Better Auth), jadi tidak butuh database atau secret di CI.
- [ ] Ganti nama file tes menjadi `*.test.ts` secara bertahap, atau pertahankan pola `src/test/**` (keputusan di sini, tidak keduanya).
- [ ] **Keluaran:** `ci.yml` memvalidasi Nest. **Selesai bila:** 4 target hijau di GitHub Actions.

### Fase 5 — Env & Secrets

- [ ] `apps/nest/.env.example` dipertahankan (tanpa nilai). Variabel wajib: `DATABASE_URL`, `JWT_SIGNING_KEY` (≥32 karakter). Opsional: `REDIS_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `FRONTEND_URL`, `CORS_ORIGINS`.
- [ ] Pastikan `.env*` ada di `.gitignore` root (sudah ada) dan di `.dockerignore`.
- [ ] Catatan perilaku: tanpa `REDIS_URL`, rate limit berjalan fail-open (tidak membatasi apa pun) dan BullMQ gagal init dengan log error, bukan crash.
- [ ] **Keluaran:** daftar env final di `docs/`. **Selesai bila:** tidak ada secret di riwayat git.

### Fase 6 — Database & Migrasi Drizzle

- [ ] Migrasi tetap di `apps/nest/drizzle/`. Pilih satu sumber skema: `src/db/schema/` (dipakai `drizzle.config.ts`); `drizzle/schema.ts` dan `drizzle/relations.ts` adalah artefak `db:pull`, tandai atau hapus.
- [ ] Migrasi ke Neon dijalankan manual (`db:migrate`), **bukan** dari CI.
- [ ] Cocokkan nama tabel/kolom dengan skema backend yang berlaku (PascalCase vs `snake_case` dari `casing`) sebelum menyentuh data produksi.
- [ ] **Keluaran:** panduan migrasi singkat. **Selesai bila:** `db:generate` tidak menghasilkan diff pada skema yang ada.

### Fase 7 — Selaraskan Libs Bersama

- [ ] `libs/contracts` naik ke Zod 4 dalam satu langkah; `libs/sdk` hanya memakai tipe (`z.infer`), risikonya kecil. Uji ulang `apps/api`.
- [ ] Skema `User`/auth yang dipakai Nest dipindah ke `libs/contracts` bila dibagi dengan klien.
- [ ] Bila kontrak berubah, perbarui DTO Rust, C#, dan Kotlin (kewajiban ADR 0004).
- [ ] Logger: pilih satu, `libs/logger` (pino) naik ke v10 dan dipakai Nest, atau Nest tetap lokal.
- [ ] **Keluaran:** satu versi Zod dan satu logger. **Selesai bila:** `pnpm ls zod pino` menunjukkan satu versi mayor.

### Fase 8 — Docker & Render

- [ ] `apps/nest/Dockerfile` dengan **build context = root repo** (lihat bagian 5).
- [ ] `apps/nest/Dockerfile.dockerignore` (BuildKit membacanya) atau `.dockerignore` di root.
- [ ] `render.yaml` di root: 1 service per aplikasi, `dockerfilePath` dan `dockerContext` eksplisit, `buildFilter` per service.
- [ ] Pin pnpm ke versi `packageManager` (jangan `pnpm@latest` seperti Dockerfile lama).
- [ ] **Keluaran:** image Nest terbangun dan `/health` merespons 200. **Selesai bila:** deploy Render pertama sukses.

### Fase 9 — Cutover & Pembersihan

- [ ] Uji asap: `/health`, register, login, `me`, periods.
- [ ] Frontend diarahkan ke URL Nest baru (`CORS_ORIGINS`/`FRONTEND_URL` sudah mencakup origin-nya).
- [ ] Hapus `/nest` dari repo aumo-finance hanya setelah persetujuan tertulis.
- [ ] Tambah changeset dan perbarui ADR 0007 menjadi *Accepted*.
- [ ] **Keluaran:** satu sumber kebenaran untuk Nest. **Selesai bila:** repo lama bebas dari `/nest`.

## 5. Docker di Render pada Monorepo

Render tetap mendukung Dockerfile untuk beberapa service dalam satu repo. Setiap service memiliki `dockerfilePath` dan `dockerContext` sendiri.

**Aturan penting:**

- Jangan set *Root Directory* untuk service Docker yang butuh `libs/*`. File di luar root directory tidak tersedia saat build.
- Biarkan Root Directory kosong, set *Dockerfile Path* dan *Docker Build Context Directory* ke root repo (`.`).
- Gunakan `buildFilter` agar perubahan di satu aplikasi tidak memicu deploy semua service. Path build filter selalu relatif terhadap root repo.

**`apps/nest/Dockerfile` (usulan, context = root repo):**

```dockerfile
FROM node:24-slim AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/nest/package.json apps/nest/
RUN pnpm install --frozen-lockfile --filter @app/nest...
COPY apps/nest apps/nest
RUN pnpm --filter @app/nest build
RUN pnpm --filter @app/nest deploy --prod /out

FROM node:24-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --chown=node:node --from=build /out .
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

Bila Nest nantinya memakai `libs/*`, tambahkan `COPY libs/<nama>/package.json libs/<nama>/` pada tahap pertama dan `COPY libs libs` sebelum `build`.

**`render.yaml` (usulan):**

```yaml
services:
  - type: web
    name: aumo-nest
    runtime: docker
    dockerfilePath: ./apps/nest/Dockerfile
    dockerContext: .
    healthCheckPath: /health
    buildFilter:
      paths:
        - apps/nest/**
        - libs/**
        - pnpm-lock.yaml
        - package.json
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SIGNING_KEY
        sync: false
      - key: CORS_ORIGINS
        sync: false

  - type: web
    name: aumo-analog
    runtime: static
    buildCommand: pnpm install --frozen-lockfile && pnpm --filter @app/analog build
    staticPublishPath: apps/analog/dist/client
    buildFilter:
      paths:
        - apps/analog/**
        - libs/**
        - pnpm-lock.yaml
    envVars:
      - key: NODE_VERSION
        value: "24"
      - key: VITE_API_URL
        sync: false
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

**Analog (web):** build-nya menghasilkan berkas statis (`dist/client`), jadi Dockerfile + nginx tidak wajib. *Static Site* Render lebih hemat (tidak ada instance yang tidur) dan tanpa image. Dockerfile web hanya perlu bila Analog nanti memakai SSR. `VITE_API_URL` harus tersedia **saat build**, bukan saat runtime.

## 6. Risiko

| Risiko | Penanganan |
| --- | --- |
| Naik Node 24 mengubah perilaku workflow lain (Rust, .NET, Android) | Fase 2 berdiri sendiri; uji sebelum kode Nest masuk |
| `bcrypt` (native) tidak terbangun di image | Daftar di `onlyBuiltDependencies`; pakai `node:24-slim` (glibc) |
| Dua versi Zod/pino hidup bersamaan | Terbatas per paket sampai Fase 7; jangan impor lintas paket dulu |
| Tanpa Redis, rate limit mati | Disadari, bukan bug; aktifkan `REDIS_URL` bila perlu pembatasan |
| Layanan auth ganda (Go dan Better Auth) | Diputuskan di Fase 1 sebelum ada kode yang bergantung |
| Cold start free tier Render | Timeout klien ≥ 45 detik pada konsumen API |
