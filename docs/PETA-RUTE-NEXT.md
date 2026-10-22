# Peta Integrasi `apps/next` (Rute API dan Gerbang)

> Status: **PEMETAAN SAJA.** Dokumen ini tidak mengubah kode apa pun.
> Cakupan: `apps/next` terintegrasi dengan baik pada rute API yang tersedia. `apps/next` menggantikan `apps/analog` secara total dan independen, tanpa pemetaan halaman (ADR 0011).
> Pendukung: `apps/api` dihapus (Fase 1). Seluruh rute yang sekarang ada tetap ditangani `apps/nest`, `services/auth` (Go), dan `dotnet/`.

---

## 1. Ringkasan Keputusan

| Pos | Keputusan |
| --- | --- |
| Frontend | `apps/next` (Next.js, static export) menggantikan `apps/analog` secara total |
| `apps/api` | Dihapus di **Fase 1**. Isinya hanya tes tiruan (tidak ada kode produksi) |
| Backend | Tidak berubah. `apps/nest` (non-akuntansi), Go (auth), .NET (akuntansi). ADR 0006, 0009, 0010 tetap berlaku |
| Gerbang | Nginx tetap menjadi router. Tidak ada proxy baru |
| Prefix API | Semua panggilan Next berawalan `/api` pada satu origin (cookie `auth_session` tetap terkirim) |
| Kontrak | Rute Next diselaraskan ke backend. Backend hanya ditambah untuk celah yang tidak punya rute |
| Biaya | Nol tambahan |
| Aturan | CI wajib hijau di akhir tiap fase |

## 2. Inventaris Baseline

| Kelompok | Isi |
| --- | --- |
| `apps/next` | 38 endpoint RTK Query di `src/lib/store/**` lewat `baseApi` (`src/lib/apiClient.ts`). Basis URL dari `NEXT_PUBLIC_WEB_API_URL` |
| Halaman Next | `/auth`, `/auth/login`, `/auth/register`, `/`, dan grup `(authenticated)`: `home`, `dashboard`, `journal-entry`, `chart-of-accounts`, `periods`, `reports/*`, `tools`, `settings`, `ai-assistant` |
| `apps/nest` | 9 modul (`health`, `home`, `dashboard`, `notifications`, `avatars`, `journal-entries`, `tools`, `settings`, `example`), port 5000 |
| `services/auth` (Go) | `/auth/register`, `/login`, `/logout`, `/validate`, `/me`, `/google-login`, `/google-callback`, `/healthz`. Port 8080 |
| `dotnet/` | `periods`, `chart-of-accounts`, `reports/*`. Port 5100 |
| `apps/api` | Stub: `package.json`, `CHANGELOG.md`, `tsconfig.json`, `src/app.test.ts` (aplikasi tiruan + `CreateUserSchema`) |
| Gerbang | `nginx.conf`: `auth_request` ke Go, `location` per layanan |

## 3. Peta Rute: Panggilan `apps/next` → Pemilik

Awalan `/api` ditambahkan Next dan dipotong Nginx. Status: **OK** = cocok, **SELARASKAN** = tidak cocok, **CELAH** = belum ada di backend manapun.

### 3.1 Auth (Go)

| Metode | Rute | Status |
| --- | --- | --- |
| POST | `/auth/login` | OK |
| POST | `/auth/google-login` | OK |
| GET | `/auth/me` | OK |
| POST | `/auth/logout` | OK |
| POST | `/auth/register` | **SELARASKAN.** UI daftar ada, `authApi` tidak memiliki endpoint `register` |

### 3.2 Akuntansi (.NET)

| Metode | Rute | Status |
| --- | --- | --- |
| GET, POST | `/periods` | OK |
| GET | `/periods/open-info` | OK |
| POST | `/periods/{id}/select` | **SELARASKAN.** .NET: `/periods/select/{id}` |
| POST | `/periods/{id}/close` | **SELARASKAN.** .NET: `/periods/close/{id}` |
| POST | `/periods/clear-selection` | OK |
| GET, POST | `/chart-of-accounts` | OK |
| PUT, DELETE | `/chart-of-accounts/{id}` | OK |
| GET | `/reports/income-statement`, `/retained-earnings`, `/statement-of-cash-flow`, `/statement-of-financial-position` | OK |
| GET | `/reports/general-ledgers/permanent`, `/temporary` | OK |
| POST | `/reports/general-ledgers/refresh` | OK |
| GET | `/reports/journals/general`, `/adjusting`, `/closing` | OK |
| DELETE | `/reports/journals/adjusting/{id}` | OK |
| GET | `/reports/worksheet` | OK |
| GET | `/reports/trial-balances?type=unadjusted\|adjusted\|post-closing` | **CELAH.** Tidak ada route di `dotnet/` (hanya `TrialBalanceViewModel`) |

### 3.3 Non-akuntansi (Nest)

| Metode | Rute | Status |
| --- | --- | --- |
| GET | `/` (cek hidup) | OK |
| GET | `/dashboard` | OK |
| GET | `/kurs`, `/home/market-indicators` | OK |
| GET | `/notifications` | OK |
| PUT | `/notifications/{id}/read`, `/notifications/read-all` | OK |
| GET | `/journal-entry/{id}`, `/search-descriptions`, `/next-transaction-number` | OK |
| POST | `/journal-entry/create` | OK |
| PUT | `/journal-entry/edit/{id}` | OK |
| DELETE | `/journal-entry/delete/{id}` | OK |
| GET | `/tools/download-journal-template` | OK |
| POST | `/tools/preview-journal-import`, `/tools/import-journal-entries` | OK |
| POST | `/settings/avatar` | **SELARASKAN (Nginx).** Nginx mengirim semua `/api/settings/` ke Go (T3) |
| GET | `/avatars/{fileName}` (publik) | **SELARASKAN (Nginx).** Nginx mengirim ke Go, bukan Nest (T3) |

### 3.4 Settings (Go) dan Guardian

| Metode | Rute | Pemilik rencana | Status |
| --- | --- | --- | --- |
| PUT | `/settings/profile` | Go | **CELAH.** Go belum memiliki handler `/settings/*` |
| POST | `/settings/change-password` | Go | **CELAH** |
| DELETE | `/settings/delete-account` | Go | **CELAH** |
| POST | `/settings/guardian/revoke-session/{id}` | tidak ada | **CELAH.** Guardian dikeluarkan (ADR 0010, Keputusan 12), tetapi `settings/security.tsx` masih memanggilnya |
| POST | `/settings/guardian/revoke-all-sessions` | tidak ada | **CELAH** (sama) |

## 4. Temuan

| # | Temuan | Dampak | Perbaikan |
| --- | --- | --- | --- |
| T1 | `apiClient.ts` membaca `NEXT_PUBLIC_WEB_API_URL`, `Dockerfile` mengisi `NEXT_PUBLIC_API_URL=/api` | Basis URL kosong di produksi. Panggilan tanpa `/api` jatuh ke `try_files` dan mengembalikan HTML | Satukan ke `NEXT_PUBLIC_API_URL`, default `/api`. Nama lama dibuang |
| T2 | Next: `/periods/{id}/select`, `/close`. .NET: `/periods/select/{id}`, `/close/{id}` | 404 | Ubah Next mengikuti .NET (acuan: ADR 0009) |
| T3 | Nginx: `location ^~ /api/settings/` dan `^~ /api/avatars/` memakai `proxy_pass` ke Go (8080). Modul `settings/avatar` dan `avatars` ada di Nest (5000) | Unggah dan tampil avatar gagal | Pisahkan: `= /api/settings/avatar` dan `^~ /api/avatars/` ke Nest |
| T4 | Nginx: `location /auth/` meneruskan semua `/auth/*` ke Go. Halaman Next ada di `/auth`, `/auth/login`, `/auth/register` | Halaman login dan daftar tidak pernah tampil (diteruskan ke Go, bukan file statis) | Hapus `location /auth/`. API auth hanya lewat `/api/auth/*` |
| T5 | `/reports/trial-balances` tidak ada di .NET | 404 pada tiga halaman neraca saldo | Tambah `GET reports/trial-balances?type=` di `dotnet/` memakai `TrialBalanceViewModel` |
| T6 | Go belum punya `/settings/*` | Pengaturan profil, sandi, hapus akun gagal | Tambah handler di `services/auth` (ADR 0010, Fase 7) |
| T7 | Next memanggil `guardian/*` yang tidak diduplikasi | Tab keamanan gagal | Hapus UI guardian dari Next (baseline). Alternatif: cabut Keputusan 12 ADR 0010 |
| T8 | `authApi` tanpa `register` | Daftar akun tidak terhubung ke Go | Tambah mutation `register` ke `POST /auth/register`. Go membalas 201 tanpa cookie, lanjutkan dengan login otomatis |
| T9 | `src/proxy.ts` hanya `NextResponse.next()`, dan `output: "export"` tidak menjalankan proxy/middleware | Tidak ada penjaga rute di server | Penjaga tetap di klien (`(authenticated)/layout.tsx` via `/auth/me`). Server menolak lewat 401 dari Nginx |
| T10 | `rewrites` dev di `next.config.ts` mengarahkan semua `/api/*` ke satu backend (port 5000) | Dev lokal: auth dan akuntansi gagal | Pecah rewrite per grup: `/api/auth/*` → 8080, `/api/{periods,chart-of-accounts,reports,summary}` → 5100, sisanya → 5000 |
| T11 | `apps/next/.next/` (934 berkas) dan `tsconfig.tsbuildinfo` ter-commit. `.gitignore` tidak memuat `.next` | Repo membengkak, konflik tiap build | `git rm -r --cached`, tambah ke `.gitignore` |
| T12 | `render.yaml` `buildFilter` memuat `apps/analog/**`, tanpa `apps/next/**` | Perubahan Next tidak memicu deploy | Ganti ke `apps/next/**` |

## 5. Topologi Target

```
Browser ──► Nginx ($PORT)
              ├─ /                       → file statis Next (apps/next/out)
              ├─ /health                 → Nest (publik, untuk Render)
              ├─ /api/auth/*             → Go   (127.0.0.1:8080)
              ├─ /api/settings/{profile,change-password,delete-account}
              │                          → auth_request → Go
              ├─ /api/settings/avatar    → auth_request → Nest (batas 10 MB)
              ├─ /api/avatars/*          → Nest (publik)
              ├─ /api/{periods,chart-of-accounts,reports,summary}
              │                          → auth_request → .NET (127.0.0.1:5100)
              └─ /api/*  (sisanya)       → auth_request → Nest (127.0.0.1:5000)
```

Aturan yang wajib dipertahankan dari `nginx.conf` sekarang: rute publik tanpa auth (`health`, `reference`, `openapi.json`, `avatars`, `accounting/health|reference|openapi.json`), `X-User-Id` dikosongkan pada rute publik, penanganan preflight `OPTIONS`, `client_max_body_size` 10 MB untuk `tools` dan `settings/avatar`, jawaban 401 `{"success":false,"message":"Unauthorized"}`, dan fallback statis `try_files $uri $uri/ $uri.html /index.html`.

## 6. Fase (8 Fase)

| Fase | Pekerjaan | Hasil | Gerbang |
| --- | --- | --- | --- |
| 1 | **Hapus `apps/api`.** (a) Pindahkan dua kasus tes `CreateUserSchema` (payload valid, payload tidak valid) ke `libs/contracts/src/user.schema.test.ts` tanpa `supertest`, agar target `test` di `libs/contracts` tetap punya berkas tes. (b) `git rm -r apps/api`. (c) Hapus `COPY apps/api/package.json apps/api/` di `Dockerfile` (stage `builder-nest`). (d) Buat ulang `pnpm-lock.yaml` (hilangkan importer `apps/api`). (e) Perbarui rujukan di `docs/ALUR-BACKEND.md` (baris 40 dan 71), `docs/MIGRASI-NEST.md` (baris 14, 65, 100), `docs/MIGRASI-ANALOG.md` (baris 267): arahkan ke `apps/nest`. (f) Cek `.github/workflows/*` dan `nx.json` tidak merujuk `@app/api` | Tidak ada `apps/api`. `apps/nest` satu-satunya Node API | `pnpm install`, lalu `lint`, `typecheck`, `test`, `build`, dan `docker build` lolos |
| 2 | **Next: basis URL.** `NEXT_PUBLIC_API_URL` (default `/api`), hapus `NEXT_PUBLIC_WEB_API_URL`, buat `apps/next/.env.example`, pecah `rewrites` dev (T1, T10) | Semua panggilan berawalan `/api` | `pnpm --filter @app/next build` |
| 3 | **Next: selaraskan kontrak.** `select`/`close` (T2), mutation `register` (T8), hapus UI guardian (T7) | Rute Next cocok dengan backend | Typecheck dan lint Next |
| 4 | **Nginx.** Hapus `location /auth/` (T4). Pisahkan `settings/avatar` dan `avatars` ke Nest (T3). Selaraskan dengan topologi bagian 5 | Halaman `/auth/*` tampil. Avatar berfungsi | `nginx -t` di image, uji asap `curl` |
| 5 | **Celah backend.** `reports/trial-balances` di .NET (T5), handler `settings/{profile,change-password,delete-account}` di Go (T6) | Tidak ada status CELAH di bagian 3 | `dotnet test`, `pnpm run auth:test` |
| 6 | **Tes kontrak rute.** `scripts/check-next-routes.mjs` memindai `apps/next/src/lib/store/**`, lalu membandingkan dengan daftar pemilik rute (`docs/rute-api.json`, hasil bagian 3). Gagal bila ada rute Next yang tidak terdaftar. Jalankan di CI | Rute baru tidak bisa lolos tanpa terdaftar | CI hijau |
| 7 | **Pembersihan.** `git rm -r --cached apps/next/.next apps/next/tsconfig.tsbuildinfo`, tambah ke `.gitignore` (T11). `render.yaml`: `apps/analog/**` → `apps/next/**` (T12). Hapus `apps/analog`. Tandai `MIGRASI-ANALOG.md` dan ADR 0008 sebagai digantikan | Repo bersih | CI hijau |
| 8 | **Verifikasi akhir.** Jalankan perintah bagian 8 pada image Docker, lalu uji alur: daftar, masuk, buka periode, jurnal, laporan, unggah avatar, keluar | Next berfungsi penuh di satu origin | Semua uji asap lolos, deploy Render sehat |

## 7. Risiko

| Risiko | Mitigasi |
| --- | --- |
| Menghapus `apps/api` memutus target `test` di `libs/contracts` | Fase 1(a): tes dipindah sebelum penghapusan |
| Lockfile berubah besar | Fase 1 dikerjakan sebagai commit terpisah. `pnpm install --frozen-lockfile` di CI memastikan konsisten |
| Cookie `auth_session` tidak terkirim | Semua panggilan satu origin. Uji `Set-Cookie` pada `/api/auth/login` di Fase 8 |
| Mengubah Nginx merusak rute lain | Fase 4 dikerjakan per `location`. `nginx -t` dan uji asap tiap grup rute |
| Halaman `/auth/*` bentrok dengan API | `/auth/` tidak lagi diproksi (T4). API hanya lewat `/api/auth/*` |
| Tab keamanan hilang akibat guardian dibuang | Keputusan pemilik di Fase 3. Dapat dibatalkan dengan mencabut ADR 0010 Keputusan 12 |
| Hapus `apps/analog` kehilangan riwayat | Riwayat tetap di git. `MIGRASI-ANALOG.md` dipertahankan sebagai arsip |

## 8. Perintah Verifikasi

```bash
pnpm install --frozen-lockfile
pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build
node scripts/check-next-routes.mjs      # Fase 6
dotnet test dotnet/App.sln
pnpm run auth:test
docker build -t aumo-api .
curl -i localhost:10000/api/health      # publik, 200
curl -i localhost:10000/api/periods     # tanpa cookie, 401 JSON
curl -i localhost:10000/auth/login      # halaman Next (200 HTML), bukan Go
```
