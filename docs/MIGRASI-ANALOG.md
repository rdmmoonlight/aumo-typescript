# Peta Migrasi: `/analog` (aumo-finance) → `apps/analog` (aumo-typescript)

> Status: **PEMETAAN SAJA.** Dokumen ini tidak memindahkan atau mengubah kode apa pun.
> Sumber: `github.com/rdmmoonlight/aumo-finance`, folder `/analog` (Analog + Angular 19 + Tailwind v4, SPA statis).
> Tujuan: `github.com/rdmmoonlight/aumo-typescript` (monorepo pnpm + Nx), sebagai **frontend web** untuk Go auth (`services/auth`) dan NestJS (`apps/nest`).

---

## 1. Ringkasan Keputusan

| Pos | Keputusan |
| --- | --- |
| Folder tujuan | `apps/analog`, nama paket `@app/analog` (cocok dengan `pnpm-workspace.yaml`: `apps/*`) |
| Mode | SPA statis (`ssr: false`, `static: true`). Tidak ada server Node di runtime |
| Topologi deploy | **Satu origin.** Nginx di container root menyajikan hasil build Analog di `/` dan meneruskan API di bawah prefix `/api/` |
| Alasan satu origin | (1) Cookie `auth_session` bersifat `SameSite=Lax`, tidak terkirim pada permintaan lintas-situs. (2) Halaman Analog `/periods` bentrok dengan rute API `/periods`. (3) Tanpa CORS. (4) Satu service Render, biaya tambahan nol |
| Auth | Go auth tetap satu-satunya otoritas (ADR 0006 dan 0007). Analog memakai cookie `auth_session` (`client: "web"`) |
| Kontrak | Tipe request/response dipindah ke `libs/contracts`. Analog tidak lagi menyimpan tipe sendiri |
| Node / pnpm | Node 24, pnpm `12.14.0` (sesuai `packageManager` root). Dockerfile Analog lama (`pnpm@latest`) tidak dipakai |
| Biaya | Nol tambahan. Semua alat gratis (GitHub Actions, Render free tier) |
| Aturan | CI wajib hijau di setiap akhir fase. Tidak ada fase yang boleh merusak workflow yang sudah lolos |

## 2. Inventaris Baseline (`/analog`)

| Kelompok | Isi |
| --- | --- |
| Halaman | `/` (landing), `/login`, `/register`, `/home`, `/periods` (rute berbasis file `*.page.ts`) |
| Lapisan inti | `core/config.ts` (`API_URL`), `core/ping.guard.ts`, `guards/auth.guard.ts`, `interceptors/auth.interceptor.ts`, `services/auth.service.ts`, `store/auth.store.ts` (NgRx Signals), `models/auth.models.ts` |
| Komponen | `sidebar`, `top-bar`, `footer`, `shared/logo.ts`, `shared/icon.ts` |
| Data periode | `pages/(app)/periods/periods.service.ts` |
| Gaya | Tailwind v4 (`styles.css`, token `brand-*`, mode gelap berbasis class `dark`) |
| Generator tipe | `scripts/gen-api.mjs` + `core/api/v1.d.ts` (2.300 baris, hasil OpenAPI) |
| Server | `src/server/middleware/auth.ts` (h3) |
| Deploy lama | `Dockerfile` (Nginx + hasil build), `nginx.conf` |
| Lainnya | `AGENTS.md`, `CLAUDE.md`, `.claude/skills`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.dockerignore`, `.gitignore` |

## 3. Temuan Benturan Toolchain

| Aspek | `/analog` | `aumo-typescript` (sekarang) | Penanganan |
| --- | --- | --- | --- |
| Workspace | `pnpm-workspace.yaml` sendiri (`packages: ["."]`) + `pnpm-lock.yaml` | Workspace dan lockfile root | Keduanya tidak disalin. Lockfile root dibuat ulang |
| Build script pnpm | `allowBuilds`: `@parcel/watcher`, `esbuild`, `lmdb`, `msgpackr-extract` | Root: `bcrypt`, `esbuild`, `msgpackr-extract`, `@scarf/scarf`, `nx` | Tambah `@parcel/watcher` dan `lmdb` ke `allowBuilds` root |
| Kunci `skills` / `permissions` | Ada di `pnpm-workspace.yaml` Analog | Tidak ada | Putuskan di Fase 3: dipindah ke root atau dibuang. Verifikasi dukungannya di pnpm 12 sebelum dipindah |
| TypeScript | `moduleResolution: bundler`, dekorator, `isolatedModules`, `~5.6` | `NodeNext` strict, `^5` | `tsconfig.json` root mengecualikan `apps/analog`. Analog memakai `tsconfig` sendiri |
| ESLint | Skrip `lint` ada, **berkas konfigurasi tidak ada** | Root `^9`, hanya globals Node | Buat `apps/analog/eslint.config.js` (globals browser). Root mengabaikan `apps/analog/**` |
| Vitest | `jsdom`, `setupFiles`, `**/*.spec.ts`; `vitest ^3` | `vitest ^1`, `**/*.{test,spec}.ts` | Root mengecualikan `apps/analog/**` (spec Analog butuh jsdom dan `TestBed`) |
| Skrip `test` | **Tidak ada** (hanya `test:e2e`); `jsdom` dan `@analogjs/vitest-angular` tidak ada di `devDependencies` | `nx run-many -t test` | Tambah skrip `test` dan dependensi yang kurang (Fase 4) |
| `tsconfig.app.json` | `files` memuat `src/main.server.ts`, **berkas itu tidak ada** | – | Hapus entri itu (Fase 3) |
| Dependensi tidak terpakai | `zod`, `xlsx`, `chart.js`, `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-angular`, `front-matter` tidak diimpor di `src/` | – | Buang (Fase 3). Kurangi ukuran install dan permukaan serangan |
| Port dev | `vite.config.ts`: 3000, `angular.json`: 5173, README: 5173 | Nest/CORS default: 3000 | Satukan ke 3000 (Fase 6) |
| `.env.example` | Disebut di README, **tidak ada** | – | Buat (Fase 6) |
| Dockerfile / nginx Analog | Sendiri, `pnpm@latest`, `--no-frozen-lockfile` | Dockerfile root (Go + Nest + Nginx) | Tidak disalin. Digantikan stage build baru di Dockerfile root (Fase 7) |

## 4. Temuan Benturan Kontrak (Analog vs Backend yang Berlaku)

Dicek langsung ke `services/auth/pkg/handlers/handler.go` dan `apps/nest/src/modules/periods`.

| # | Analog (sekarang) | Backend (sekarang) | Dampak | Perbaikan |
| --- | --- | --- | --- | --- |
| K1 | Login/register mengirim `clientType: "web"` | Go membaca field `client` | Field diabaikan. Web tetap jalan hanya karena nilai kosong dianggap web | Kirim `client: "web"` |
| K2 | Respons login dibaca `{ user, userId, fullName }` | Go membalas `{ message, data: <user> }` | `AuthService.user` terisi `undefined` | Baca `res.data` |
| K3 | `/auth/me` dibaca `res.data.user` | Go membalas `data` = klaim JWT (`user_id`, `email`, ...), bukan objek `user` | Guard menganggap pengguna tidak ada | Petakan klaim ke model pengguna Analog (`id`, `email`); nama diambil dari respons login |
| K4 | Register langsung ke `/home` | Go membalas 201 **tanpa cookie** | `authGuard` memanggil `/auth/me`, dapat 401, kembali ke `/login` | Setelah register sukses, panggil login otomatis, atau arahkan ke `/login` dengan pesan sukses |
| K5 | Model `AuthUser` memuat `emailVerified`, `image`, `createdAt`, `updatedAt` | Go hanya punya `id`, `name`, `email` | Tipe berbohong | Definisikan `AuthUser` baru di `libs/contracts` |
| K6 | `PeriodsService.getPeriods()` mengharap `Period[]` | Nest membalas `{ success, selectedPeriodId, periods }` | Daftar periode kosong atau error | Baca `res.periods` |
| K7 | `createPeriod` mengirim `{ periodName, startDate, endDate }` | Nest meminta `{ year, month, setupMode: "CreateNew" \| "LoadExisting", ...akun }` dan menyediakan `GET /periods/open-info` | Pembuatan periode selalu gagal validasi | Ubah form dan DTO sesuai `CreatePeriodRequest`; muat `open-info` lebih dulu |
| K8 | `Period.userId` dipakai di tipe | Nest tidak mengirim `userId` | Tipe berbohong | Hapus field |
| K9 | `select` / `close` / `clear-selection` mengharap `void` | Nest membalas `{ success, message, ... }` | Pesan server tidak tampil | Tampilkan `message` |
| K10 | Halaman Analog `/periods` | Rute API `/periods` | Tabrakan jika satu origin tanpa prefix | Prefix API `/api` (Fase 7) |
| K11 | `gen-api.mjs` mengambil `/openapi/v1.json`; `v1.d.ts` berisi rute ASP.NET (`/home/market-indicators`) | Nest/Go mengekspos `/openapi.json` | Tipe usang, tidak cocok dengan backend ini | Hapus `v1.d.ts`; ganti sumber ke `libs/contracts` (Fase 5) |
| K12 | `pingGuard` memanggil `GET <API>/` | `GET /` Nest publik | Aman, tetapi untuk membangunkan cold start | Pertahankan, arahkan ke `/api/health` |
| K13 | `server/middleware/auth.ts` mencetak env ke log dan menjaga `/admin`, `/checkout` | App SPA (`ssr: false`), file ini tidak pernah jalan | Kode mati, berisiko bocor env bila SSR dinyalakan | Hapus (Fase 3) |
| K14 | Nav "Bagan Akun" dan "Jurnal Umum" tanpa rute | Nest belum punya controller untuk keduanya | Menu mati | Sembunyikan sampai endpoint tersedia (Fase 8) |
| K15 | `extractError` membaca `{ message, errors }` | Nest: `{ success:false, message, errors }`; Go: `{ message }` | Cocok untuk keduanya | Tidak ada perubahan |

## 5. Fase Migrasi (10 Fase)

### Fase 1 — Baseline & Keputusan

- [x] Bekukan perubahan baru di `/analog` selama migrasi.
- [x] Tetapkan topologi: satu origin, prefix API `/api` (bagian 6).
- [x] Tetapkan Analog tetap SPA statis; SSR ditunda.
- [x] Catat di `docs/adr/0008-analog-frontend-masuk-monorepo.md` (status *Proposed*).
- [x] **Keluaran:** ADR 0008. **Selesai bila:** topologi dan batas lingkup tertulis.

### Fase 2 — Penyelarasan Root (belum ada kode Analog)

- [x] `pnpm-workspace.yaml`: tambah `@parcel/watcher: true` dan `lmdb: true` pada `allowBuilds`.
- [x] `tsconfig.json` root: `exclude` + `apps/analog`.
- [x] `vitest.config.ts` root: `exclude` + `apps/analog/**`.
- [x] `eslint.config.mjs` root: `ignores` + `apps/analog/**`.
- [x] `nx.json`: tambah `outputs` target `build` (`{projectRoot}/dist`) agar cache Nx menyimpan hasil build.
- [x] **Keluaran:** CI hijau tanpa perubahan fungsional. **Selesai bila:** 3 workflow lolos.

### Fase 3 — Salin Kode ke `apps/analog`

- [x] Salin: `src/`, `public/`, `scripts/`, `index.html`, `vite.config.ts`, `angular.json`, `tsconfig*.json`, `AGENTS.md`, `CLAUDE.md`, `.gitignore`.
- [x] **Jangan** salin: `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `Dockerfile`, `nginx.conf`, `.dockerignore`.
- [x] `package.json`: nama `aumoan` → `@app/analog`, versi `0.0.0`, `private: true`; buang 8 dependensi tidak terpakai (bagian 3).
- [x] Hapus `src/server/middleware/auth.ts` (K13) dan `public/vite.svg`, `public/analog.svg` (sisa templat).
- [x] `tsconfig.app.json`: hapus `src/main.server.ts` dari `files`; hapus `include` ke `src/server/**`.
- [x] `.claude/skills` dan kunci `skills`/`permissions`: dipindah atau dibuang (keputusan tertulis di ADR 0008).
- [x] `pnpm install` di root, lalu `pnpm install --frozen-lockfile` harus lolos.
- [x] **Keluaran:** `apps/analog` ada di workspace. **Selesai bila:** `pnpm --filter @app/analog build` berhasil lokal dan menghasilkan `dist/client`.

### Fase 4 — Gerbang Mutu Analog di CI

- [x] Skrip `typecheck` (`tsc --noEmit`), `lint`, `test`, `build` ada di `apps/analog/package.json` sehingga `nx run-many` mencakupnya.
- [x] `lint`: buat `eslint.config.js` (typescript-eslint, globals browser).
- [x] `test`: tambah `jsdom` dan `@analogjs/vitest-angular`; skrip `vitest run`. `app.spec.ts` yang ada harus lolos.
- [x] `build` tidak lagi memanggil `clean` yang menghapus `node_modules/.cache` milik Nx (periksa `prebuild`).
- [ ] **Keluaran:** `ci.yml` memvalidasi Analog. **Selesai bila:** 4 target hijau di GitHub Actions.

### Fase 5 — Kontrak ke `libs/contracts`

- [ ] Buat `libs/contracts/src/auth.ts`: `LoginRequest`, `RegisterRequest`, `AuthUser`, `AuthResponse`, `MeResponse` (sesuai K1 sampai K5).
- [ ] Buat `libs/contracts/src/periods.ts`: `Period`, `GetPeriodsResponse`, `OpenPeriodInfo`, `CreatePeriodRequest` (sesuai K6 sampai K9).
- [ ] Analog memakai `import type` saja dari `@app/contracts`, agar Zod tidak masuk bundle browser.
- [ ] Hapus `models/auth.models.ts`, `core/api/v1.d.ts`, `scripts/gen-api.mjs`, dan skrip `gen:api` (K11).
- [ ] Bila kontrak berubah, perbarui DTO Rust, C#, dan Kotlin (kewajiban ADR 0004); jalankan `scripts/validate-contracts.ts`.
- [ ] **Keluaran:** satu sumber tipe untuk web. **Selesai bila:** `pnpm run typecheck` hijau dan Analog tidak punya tipe API lokal.

### Fase 6 — Env & Server Dev

- [ ] `apps/analog/.env.example`: `VITE_API_URL=/api` (tanpa nilai rahasia).
- [ ] `core/config.ts`: bawaan `/api`, bukan `http://localhost:5000`.
- [ ] `vite.config.ts`: `server.proxy` `/api` → `http://localhost:10000` (hasil `docker compose up`), sehingga dev dan produksi memakai jalur yang sama.
- [ ] Satukan port dev ke 3000 (`angular.json`, README).
- [ ] `VITE_API_URL` dibaca **saat build**, bukan runtime; catat di dokumentasi.
- [ ] **Keluaran:** `pnpm --filter @app/analog dev` terhubung ke backend lokal. **Selesai bila:** login lokal berhasil dan cookie tersimpan.

### Fase 7 — Gateway & Docker (bagian 6)

- [ ] `Dockerfile` root: tambah stage `builder-web` (Node 24, pnpm `12.14.0`, `--filter @app/analog...`, `ARG VITE_API_URL=/api`).
- [ ] Stage akhir: salin `apps/analog/dist/client` ke `/usr/share/nginx/html`.
- [ ] `nginx.conf`: API pindah ke prefix `/api/`; `/` menyajikan statis dengan `try_files` ke `/index.html`; `/health` tetap di root untuk Render.
- [ ] `nest_proxy.conf`: tambah varian untuk `proxy_pass` ber-URI (pemotongan prefix).
- [ ] Nest/Scalar: `servers` OpenAPI diisi `/api` agar "Try it" memakai prefix yang benar.
- [ ] `render.yaml`: tambah `apps/analog/**` dan `libs/**` pada `buildFilter` (sudah ada `libs/**`).
- [ ] `docker-compose.yml`: tidak berubah selain komentar alamat (`http://localhost:10000/`).
- [ ] **Keluaran:** satu image berisi Go, Nest, dan web. **Selesai bila:** `docker compose up --build` menampilkan web di `/` dan Scalar di `/api/reference`.

### Fase 8 — Penyesuaian Halaman

- [ ] `AuthService`: kirim `client: "web"`, baca `data`, petakan `/auth/me` (K1 sampai K3).
- [ ] Register: login otomatis atau arahkan ke `/login` (K4).
- [ ] `PeriodsService` dan halaman `/periods`: bentuk respons baru, form `year`/`month`/`setupMode`, muat `open-info` (K6 sampai K9).
- [ ] Tampilkan `message` dari server pada aksi `select`/`close`/`clear-selection`.
- [ ] Sembunyikan menu "Bagan Akun" dan "Jurnal Umum" (K14).
- [ ] `pingGuard`: arahkan ke `/api/health` (K12).
- [ ] **Keluaran:** alur halaman sesuai backend. **Selesai bila:** tidak ada pemanggilan ke rute yang tidak ada.

### Fase 9 — Uji Asap & Cutover

- [ ] Uji lokal dan di Render: `/`, register, login, `/auth/me`, daftar periode, buat periode, pilih, tutup, logout, muat ulang halaman (sesi bertahan), 401 mengarahkan ke `/login`.
- [ ] Cookie di belakang TLS Render: `COOKIE_SECURE` tetap `true`, header `X-Forwarded-Proto` diteruskan (sudah ada di `nginx.conf`).
- [ ] `FRONTEND_URL` diarahkan ke origin Render itu sendiri (tujuan redirect login Google).
- [ ] `GOOGLE_REDIRECT_URL` tetap `https://<service>.onrender.com/api/auth/google-callback`; **daftarkan ulang** di Google Cloud Console karena path berubah.
- [ ] Hapus `/analog` dari repo aumo-finance **hanya setelah persetujuan tertulis**.
- [ ] **Keluaran:** satu sumber kebenaran untuk web. **Selesai bila:** repo lama bebas dari `/analog`.

### Fase 10 — Pembersihan & Dokumentasi

- [ ] Changeset untuk `@app/analog` dan `@app/contracts`.
- [ ] ADR 0008 menjadi *Accepted*.
- [ ] Perbarui `docs/DEPLOY-RENDER.md` (proses ke-4: web statis, alur `/api`), `README.md` root, dan `docs/ALUR-BACKEND.md` (rujukan "Next.js/Analog").
- [ ] Catat daftar env final (`VITE_API_URL`) di `docs/`.
- [ ] **Keluaran:** dokumentasi sinkron. **Selesai bila:** tidak ada rujukan ke jalur lama (`/auth/*` tanpa prefix untuk klien web).

## 6. Topologi Deploy: Satu Origin

```
Browser ──► Nginx ($PORT)
              ├─ /              → file statis Analog (SPA, fallback /index.html)
              ├─ /health        → Nest (publik, untuk Render)
              ├─ /api/auth/*    → Go auth  (127.0.0.1:8080, prefix dipotong)
              ├─ /api/health, /api/reference, /api/openapi.json → Nest (publik)
              └─ /api/*         → auth_request → Go /auth/validate → Nest (127.0.0.1:5000)
```

**Aturan pemotongan prefix Nginx:** `proxy_pass` yang memiliki bagian URI memotong prefix lokasi yang cocok.

```nginx
location ^~ /api/auth/ { proxy_pass http://127.0.0.1:8080/auth/; }

location ^~ /api/ {
    auth_request /_validate;
    auth_request_set $auth_user_id $upstream_http_x_user_id;
    error_page 401 = @unauthorized;
    proxy_set_header X-User-Id $auth_user_id;
    proxy_pass http://127.0.0.1:5000/;
}

location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
}
```

Catatan: sketsa di atas belum memuat rute publik (`/api/health`, `/api/reference`, `/api/openapi.json`), pengecualian preflight, dan penimpaan `X-User-Id` kosong. Semua itu **wajib** dipertahankan dari `nginx.conf` yang ada saat Fase 7.

**Pembanding (tidak dipilih):** *Static Site* Render terpisah. Lebih hemat instance, tetapi berbeda situs dari API, sehingga cookie `SameSite=Lax` tidak terkirim. Dapat dipakai hanya bila Go auth diubah ke `SameSite=None; Secure` dan CORS Go diperluas (kini hanya `GET, POST, OPTIONS`). Itu mengubah keamanan layanan auth, jadi butuh ADR sendiri.

## 7. Risiko

| Risiko | Penanganan |
| --- | --- |
| Pengguna Go auth disimpan di memori proses (hilang saat restart, lihat `DEPLOY-RENDER.md`) | Dicatat. Web berfungsi penuh hanya setelah auth memakai database; di luar lingkup migrasi ini |
| Path Google callback berubah (`/auth/*` → `/api/auth/*`) | Daftarkan ulang di Google Cloud Console sebelum cutover (Fase 9) |
| Scalar memakai URL tanpa prefix | Isi `servers: [{ url: "/api" }]` di OpenAPI (Fase 7) |
| Cold start free tier Render | `pingGuard` ke `/api/health`; timeout klien ≥ 45 detik |
| `libs/contracts` berupa sumber TS (`main: ./src/index.ts`); Analog memakai `moduleResolution: bundler` | Uji impor di Fase 5; bila gagal, tambahkan alias path di `tsconfig` Analog |
| Zod 4 di root, Analog sebelumnya memuat Zod 3 | Zod dibuang dari Analog (tidak terpakai); tipe diambil lewat `import type` |
| Vitest ganda (root `^1`, Analog `^3`) | Terisolasi per paket sampai versi diselaraskan; jangan impor lintas paket |
| `prebuild: clean` menghapus cache | Ganti agar hanya menghapus `dist` |
| Cookie `Secure` ditolak pada HTTP lokal | Lokal: `COOKIE_SECURE=false` (sudah di `docker-compose.yml`) |

## 8. Perintah Verifikasi

```bash
pnpm install --frozen-lockfile
pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build
pnpm --filter @app/analog build        # hasil: apps/analog/dist/client
docker compose up --build              # web: http://localhost:10000/  Scalar: /api/reference
pnpm ls zod vitest                     # periksa versi ganda
```
