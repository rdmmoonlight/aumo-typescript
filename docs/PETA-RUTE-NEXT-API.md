# Peta Rute: `apps/next` ↔ `apps/api`

> Status: **PEMETAAN SAJA.** Dokumen ini tidak mengubah kode apa pun.
> Cakupan: (1) menyelaraskan rute API yang dipanggil `apps/next` dengan rute yang tersedia di backend, (2) menjadikan `apps/api` penangan seluruh rute `/api/*` (sekarang `apps/nest`).
> Di luar cakupan: pemetaan halaman `apps/analog` ke `apps/next`. `apps/next` menggantikan `apps/analog` secara total dan independen (ADR 0011).

---

## 1. Ringkasan Keputusan

| Pos | Keputusan |
| --- | --- |
| Frontend | `apps/next` (Next.js, static export) menggantikan `apps/analog` secara total. Tidak ada pemetaan halaman |
| Prefix API | Seluruh panggilan `apps/next` memakai prefix `/api` (satu origin, cookie `auth_session` tetap terkirim) |
| Pintu API | `apps/api` menjadi satu-satunya upstream `/api/*` di belakang Nginx |
| Isi `apps/api` | Seluruh kode `apps/nest` dipindah ke `apps/api` (paket `@app/api`). Rute milik Go dan .NET diteruskan (reverse proxy) oleh `apps/api` |
| Pemilik logika | Tidak berubah: auth di Go (ADR 0006), akuntansi di .NET (ADR 0009), sisanya di Nest (ADR 0010) |
| Kontrak | Satu registri rute (`apps/api`) menjadi sumber kebenaran. Tes kontrak membandingkannya dengan panggilan `apps/next` |
| Biaya | Nol tambahan. Tidak ada proses baru di container |
| Aturan | CI wajib hijau di akhir tiap fase |

## 2. Inventaris Baseline

| Kelompok | Isi |
| --- | --- |
| `apps/next` | 38 endpoint RTK Query di `src/lib/store/**` lewat `baseApi` (`src/lib/apiClient.ts`). Basis URL dibaca dari `NEXT_PUBLIC_WEB_API_URL` |
| `apps/nest` | 9 modul (`health`, `home`, `dashboard`, `notifications`, `avatars`, `journal-entries`, `tools`, `settings`, `example`), NestJS 11, Drizzle, Zod, Scalar di `/reference`, port 5000 |
| `apps/api` | Stub. Hanya `src/app.test.ts` (aplikasi tiruan) dan dependensi `@app/contracts`, `@app/logger` |
| `services/auth` (Go) | `/auth/register`, `/login`, `/logout`, `/validate`, `/me`, `/google-login`, `/google-callback`, `/healthz` |
| `dotnet/` (ASP.NET) | `periods`, `chart-of-accounts`, `reports/*` (financial statements, journals, general-ledgers, worksheet, summary) |
| Gerbang | `nginx.conf`: `auth_request` ke Go, tiap grup rute punya `location` sendiri |

## 3. Peta Rute: Panggilan `apps/next` → Pemilik

Awalan `/api` ditambahkan Nginx/Next. Kolom Status: **OK** = cocok, **SELARASKAN** = tidak cocok, **CELAH** = belum ada di backend manapun.

### 3.1 Auth

| Metode | Rute | Pemilik | Status |
| --- | --- | --- | --- |
| POST | `/auth/login` | Go | OK |
| POST | `/auth/google-login` | Go | OK |
| GET | `/auth/me` | Go | OK |
| POST | `/auth/logout` | Go | OK |
| POST | `/auth/register` | Go | **SELARASKAN** (UI register ada, `authApi` tidak memiliki endpoint `register`) |

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
| GET | `/reports/income-statement` | OK |
| GET | `/reports/retained-earnings` | OK |
| GET | `/reports/statement-of-cash-flow` | OK |
| GET | `/reports/statement-of-financial-position` | OK |
| GET | `/reports/general-ledgers/permanent`, `/temporary` | OK |
| POST | `/reports/general-ledgers/refresh` | OK |
| GET | `/reports/journals/general`, `/adjusting`, `/closing` | OK |
| DELETE | `/reports/journals/adjusting/{id}` | OK |
| GET | `/reports/worksheet` | OK |
| GET | `/reports/trial-balances?type=unadjusted\|adjusted\|post-closing` | **CELAH.** Tidak ada route ini di `dotnet/` (hanya `TrialBalanceViewModel`) |

### 3.3 Non-akuntansi (Nest, pindah ke `apps/api`)

| Metode | Rute | Status |
| --- | --- | --- |
| GET | `/` (cek hidup) | OK |
| GET | `/dashboard` | OK |
| GET | `/kurs` | OK |
| GET | `/home/market-indicators` | OK |
| GET | `/notifications` | OK |
| PUT | `/notifications/{id}/read`, `/notifications/read-all` | OK |
| GET | `/journal-entry/{id}`, `/search-descriptions`, `/next-transaction-number` | OK |
| POST | `/journal-entry/create` | OK |
| PUT | `/journal-entry/edit/{id}` | OK |
| DELETE | `/journal-entry/delete/{id}` | OK |
| GET | `/tools/download-journal-template` | OK |
| POST | `/tools/preview-journal-import`, `/tools/import-journal-entries` | OK |
| POST | `/settings/avatar` | OK |
| GET | `/avatars/{fileName}` (publik) | OK |

### 3.4 Settings (Go) dan Guardian

| Metode | Rute | Pemilik rencana | Status |
| --- | --- | --- | --- |
| PUT | `/settings/profile` | Go | **CELAH.** Go belum memiliki handler `/settings/*` |
| POST | `/settings/change-password` | Go | **CELAH** |
| DELETE | `/settings/delete-account` | Go | **CELAH** |
| POST | `/settings/guardian/revoke-session/{id}` | tidak ada | **CELAH.** Guardian dikeluarkan di ADR 0010 (Keputusan 12), tetapi `settings/security.tsx` masih memanggilnya |
| POST | `/settings/guardian/revoke-all-sessions` | tidak ada | **CELAH** (sama) |

### 3.5 Rute `apps/nest` yang tidak dipakai Next

`/examples`, `/examples/{id}`, `/examples/public-info`, `/health`. Rute `examples` adalah contoh modul, tidak masuk registri produksi (dipertahankan hanya saat `NODE_ENV != production`).

## 4. Temuan

| # | Temuan | Dampak | Perbaikan |
| --- | --- | --- | --- |
| T1 | `apiClient.ts` membaca `NEXT_PUBLIC_WEB_API_URL`, `Dockerfile` mengisi `NEXT_PUBLIC_API_URL=/api` | Basis URL kosong di produksi. Semua panggilan tanpa `/api`. Hanya `/auth/*` terlayani Nginx. Sisanya jatuh ke `try_files` dan mengembalikan HTML | Satukan ke `NEXT_PUBLIC_API_URL`, default `/api`. Nama lama dibuang |
| T2 | Next memakai `/periods/{id}/select`, `/close`; .NET `/periods/select/{id}`, `/close/{id}` | 404 | Ubah Next mengikuti .NET (kontrak ASP.NET adalah acuan, ADR 0009) |
| T3 | `/reports/trial-balances` tidak ada di .NET | 404 pada 3 halaman neraca saldo | Tambah route di `dotnet/` (`GET reports/trial-balances?type=`), memakai `TrialBalanceViewModel` yang ada |
| T4 | Go belum punya `/settings/*` | Settings profil, sandi, hapus akun gagal | Tambah handler di `services/auth` (ADR 0010, Fase 7) |
| T5 | Next memanggil `guardian/*` yang tidak diduplikasi | Tab keamanan gagal | Keputusan pemilik: hapus UI guardian dari Next (dipilih sebagai baseline), atau cabut Keputusan 12 ADR 0010 |
| T6 | `authApi` tanpa `register` | Daftar akun tidak terhubung ke Go | Tambah mutation `register` ke `POST /auth/register` (Go membalas 201 tanpa cookie, lalu login otomatis) |
| T7 | `src/proxy.ts` hanya `NextResponse.next()`, dan `output: "export"` tidak menjalankan proxy/middleware | Tidak ada penjaga rute di server | Penjaga tetap di klien (`(authenticated)/layout.tsx` via `/auth/me`). Server menolak lewat 401 dari `apps/api` |
| T8 | `apps/next/.next/` (934 berkas) dan `tsconfig.tsbuildinfo` ter-commit; `.gitignore` tidak memuat `.next` | Repo membengkak, konflik tiap build | `git rm -r --cached`, tambah ke `.gitignore` |
| T9 | `render.yaml` `buildFilter` memuat `apps/analog/**`, tanpa `apps/next/**` dan `apps/api/**` | Perubahan Next/API tidak memicu deploy | Ganti ke `apps/next/**`, `apps/api/**` |
| T10 | Nginx punya `location` terpisah per layanan (Go, .NET, Nest) | Rute baru butuh ubah Nginx | Satu `location /api/` ke `apps/api` |

## 5. Topologi Target

```
Browser ──► Nginx ($PORT)
              ├─ /       → file statis Next (apps/next/out)
              ├─ /health → apps/api (publik, untuk Render)
              └─ /api/*  → apps/api (127.0.0.1:5000)
                            ├─ rute milik api  → modul Nest (Drizzle, Redis, S3)
                            ├─ /api/auth/*, /api/settings/{profile,change-password,delete-account}
                            │                  → proxy ke Go    (127.0.0.1:8080)
                            ├─ /api/periods, /chart-of-accounts, /reports/*, /summary
                            │                  → proxy ke .NET  (127.0.0.1:5100)
                            └─ /api/reference, /api/openapi.json → Scalar gabungan
```

Aturan yang wajib dipertahankan dari `nginx.conf` sekarang: rute publik tanpa auth (`health`, `reference`, `openapi.json`, `avatars`, `accounting/health|reference|openapi.json`), `X-User-Id` dikosongkan pada rute publik, penanganan preflight `OPTIONS`, `client_max_body_size` 10 MB untuk `tools` dan `settings/avatar`, jawaban 401 berbentuk `{"success":false,"message":"Unauthorized"}`.

## 6. Fase (10 Fase)

| Fase | Pekerjaan | Hasil | Gerbang |
| --- | --- | --- | --- |
| 1 | **Baseline.** Bekukan perubahan rute. Catat respons 38 endpoint Next sebagai tes kontrak awal | Berkas daftar rute + snapshot | CI hijau |
| 2 | **Next: basis URL.** `NEXT_PUBLIC_API_URL` (default `/api`), hapus `NEXT_PUBLIC_WEB_API_URL`, perbarui `next.config.ts` (rewrites dev) dan `.env.example` (T1) | Semua panggilan berawalan `/api` | `pnpm --filter @app/next build` |
| 3 | **Next: selaraskan kontrak.** `select`/`close` (T2), `register` (T6), putuskan guardian (T5) | Rute Next cocok dengan backend | Typecheck + lint Next |
| 4 | **Backend: celah.** `trial-balances` di .NET (T3), handler `settings/*` di Go (T4) | 0 celah di bagian 3 | `dotnet test`, `go test` |
| 5 | **Rename `apps/nest` → `apps/api`.** `git mv`, paket `@app/api`, perbarui `Dockerfile`, `supervisord.conf` (`/app/api`), `render.yaml` (T9), `nx`, workflow CI. Stub `app.test.ts` dihapus, tes `CreateUserSchema` dipindah ke `libs/contracts`. Port tetap 5000 | `apps/api` = kode Nest | CI hijau, tes Nest lolos |
| 6 | **Registri rute.** `apps/api/src/routes/registry.ts`: metode, path, pemilik (`api` \| `go` \| `dotnet`), publik atau terlindungi. Tes kontrak memindai `apps/next/src/lib/store/**` dan gagal bila ada rute yang tidak terdaftar | Satu sumber kebenaran | Tes kontrak hijau |
| 7 | **Proxy Go dan .NET.** Modul `proxy` memakai `http-proxy-middleware`: tanpa membaca body (unggahan tetap utuh), meneruskan `Set-Cookie`, menulis ulang `/api/summary` → `/reports/summary` | `apps/api` menjawab semua rute di bagian 3 | Uji asap tiap grup |
| 8 | **Auth di `apps/api` dan Nginx sederhana.** Guard memvalidasi sesi ke Go `/auth/validate` (cache pendek), mengisi `X-User-Id`. Nginx tinggal tiga `location` (bagian 5). Hapus `auth_request`, `@go_preflight`, `@dotnet_preflight` (T10) | Nginx ±40 baris | 401 identik dengan sebelumnya |
| 9 | **OpenAPI gabungan.** `/api/reference` (Scalar) dan `/api/openapi.json` memuat spek Nest, Go, dan .NET | Semua rute terdokumentasi | Scalar menampilkan semua grup |
| 10 | **Pembersihan.** Hapus `apps/analog`, `.next` dari git (T8), perbarui README dan `docs/` | Repo bersih | CI hijau, deploy Render sehat |

## 7. Risiko

| Risiko | Mitigasi |
| --- | --- |
| Proxy menambah satu lompatan | Satu proses, loopback. Tidak ada biaya tambahan. Ukur latensi di Fase 7 |
| Memori container (512 MB) | Proxy tidak menyimpan body. Batas unggahan 10 MB dipertahankan |
| Cookie `auth_session` hilang lewat proxy | Uji `Set-Cookie`, `SameSite=Lax`, dan `Path` di Fase 7 |
| Kegagalan satu layanan menjatuhkan `/api` | Proxy mengembalikan 502 JSON per grup. `/health` melaporkan status Go dan .NET |
| Rollback | Fase 7 dan 8 dilakukan per grup rute. Nginx lama tetap di riwayat git sampai Fase 10 |
| Perubahan `apps/api` memicu build semua layanan | `buildFilter` Render tetap satu service (sama seperti sekarang) |

## 8. Perintah Verifikasi

```bash
pnpm install --frozen-lockfile
pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build
pnpm --filter @app/api test            # tes kontrak registri vs Next
dotnet test dotnet/App.sln
pnpm run auth:test
docker build -t aumo-api .             # Dockerfile root
curl -i localhost:10000/api/health     # publik, 200
curl -i localhost:10000/api/periods    # tanpa cookie, 401 JSON
```
