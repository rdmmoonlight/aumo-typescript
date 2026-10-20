# Peta Duplikasi: sisa `/backend` (aumo-finance) → `apps/nest` (aumo-typescript)

> Status: **PEMETAAN SAJA.** Dokumen ini tidak memindahkan atau mengubah kode apa pun.
> Sumber: `github.com/rdmmoonlight/aumo-finance`, folder `backend/` (ASP.NET Core, Rust `axum`, placeholder `go` dan `python`).
> Tujuan: `apps/nest` (NestJS 11, Drizzle, pg, Redis/BullMQ, Zod 4) di `github.com/rdmmoonlight/aumo-typescript`.
> Pola: **duplikasi.** Kode disalin. Sumber di aumo-finance tidak dihapus.
> Pelengkap: [`MIGRASI-ASPNET-ACCOUNTING.md`](./MIGRASI-ASPNET-ACCOUNTING.md) (Reports, Periods, ChartOfAccounts → `dotnet/`). Gabungan kedua dokumen menutup **seluruh isi `/backend`**.

---

## 1. Peta Lengkap `/backend` → `aumo-typescript`

| Isi `/backend` | Tujuan | Dokumen |
| --- | --- | --- |
| `asp-net-core`: `Reports`, `Periods`, `ChartOfAccounts` + kelengkapannya | `dotnet/src/Aumo.Accounting.Api` | `MIGRASI-ASPNET-ACCOUNTING.md` |
| `asp-net-core`: `Health`, `Core`, `Home`, `Dashboard`, `Notifications`, `Avatars`, `JournalEntry`, `Tools`, `Settings` + kelengkapannya | `apps/nest/src/modules/*` | **dokumen ini** |
| `asp-net-core`: `Auth` + `Services/Auth`, `Services/Identity` | Tidak disalin. Sudah ditangani `services/auth` (Go) | ADR 0006, 0007 |
| `asp-net-core/Tests/Controllers/CoreControllerTests.cs` | `apps/nest/src/test/core.test.ts` (Vitest) | dokumen ini, Fase 4 |
| `asp-net-core/Migrations/` | Tidak disalin. Skema dimiliki Drizzle | `MIGRASI-ASPNET-ACCOUNTING.md`, Fase 5 |
| `axum/` (Rust, `cdylib`, `get_salam`) | `native/core_engine/src/salam.rs` (fungsi Rust biasa + `cargo test`). Endpoint Nest memakai TypeScript | dokumen ini, Fase 4 |
| `go/Test.txt`, `python/Test.txt` | Placeholder tanpa kode. Tidak ada yang disalin. Padanan Go sudah ada: `services/auth` | dokumen ini |
| `Dockerfile` (backend) | Tidak disalin. Digantikan `Dockerfile` root | `MIGRASI-ASPNET-ACCOUNTING.md`, Fase 8 |
| `Backend.slnx` | Tidak disalin. Digantikan `dotnet/App.sln` | `MIGRASI-ASPNET-ACCOUNTING.md`, Fase 2 |
| `README.md`, `Note.txt` | Ringkasan prinsip ada di bagian 8 | dokumen ini |

## 2. Ringkasan Keputusan

| Pos | Keputusan |
| --- | --- |
| Tujuan | Sembilan controller non-akuntansi menjadi modul Nest di `apps/nest/src/modules/<nama>/` |
| Penghapusan | **Tidak ada.** Sumber tetap di aumo-finance |
| Auth | `services/auth` (Go) tetap otoritas tunggal. 6 endpoint `AuthController` **tidak** diduplikasi di Nest |
| Identitas pengguna | Guard Nest yang sudah ada membaca `X-User-Id` dari Nginx. Modul baru memakainya |
| Skema | Drizzle (`apps/nest/src/db/schema/`). Tabel baru lewat `db:generate` dan dijalankan manual ke Neon, bukan dari CI |
| Aturan akuntansi | Dihitung hanya di `dotnet/`. Modul Nest tidak menghitung laporan. Aturan yang terpaksa ada di dua tempat (`PeriodLock`, nomor transaksi) dikunci dengan tes paritas (Fase 5) |
| Validasi | FluentValidation → Zod 4 (pipe Zod yang sudah ada di `common/pipes`) |
| Dokumentasi API | Scalar Nest (`/api/reference`). Tidak ada Scalar baru |
| Pekerjaan latar | Hangfire **tidak dibawa** (tidak ada job terdaftar di sumber). BullMQ tersedia bila dibutuhkan kelak |
| Biaya | Nol tambahan. GitHub Actions, Render free tier, Neon |
| Aturan | CI wajib hijau di setiap akhir fase |

## 3. Inventaris Baseline

### 3.1 Controller yang diduplikasi ke Nest (9 controller, 26 endpoint)

| Controller sumber | Baris | Rute sumber | Modul Nest | Metode |
| --- | --- | --- | --- | --- |
| `HealthController` | 80 | `/health` | `health` (**sudah ada**) | GET |
| `CoreController` | 102 | `/api/core/salam` | `core` | GET, POST |
| `HomeController` (2 kelas) | 176 | `/kurs`, `/home/market-indicators` | `home` | GET ×2 |
| `DashboardController` | 261 | `/dashboard` | `dashboard` | GET |
| `NotificationsController` | 138 | `/notifications`, `/notifications/{id:guid}/read`, `/notifications/read-all` | `notifications` | GET, PUT ×2 |
| `AvatarsController` | 51 | `/avatars/{fileName}` (publik) | `avatars` | GET |
| `JournalEntryController` | 399 | `/journal-entry/{id}`, `create`, `edit/{id}`, `delete/{id}`, `search-descriptions`, `next-transaction-number` | `journal-entries` | GET ×3, POST, PUT, DELETE |
| `ToolsController` | 396 | `/tools/download-journal-template`, `preview-journal-import`, `import-journal-entries` | `tools` | GET, POST ×2 |
| `SettingsController` | 312 | `/settings/profile`, `avatar`, `change-password`, `delete-account`, `guardian/dashboard`, `guardian/revoke-session/{id}`, `guardian/revoke-all-sessions` | `settings` | PUT, POST ×4, GET, DELETE |
| **Total** | **1.915** | | | **26 endpoint** |

Service pendukung: sekitar 2.400 baris (`Dashboard`, `Home`, `JournalEntries`, `Notifications`, `Settings`, `Storage`, `Tools`, `Health`, `Core`). Total controller + service sekitar **4.300 baris**, belum termasuk DTO, validator, dan model.

### 3.2 Tidak diduplikasi ke Nest

| Item | Alasan |
| --- | --- |
| `AuthController` (login, google-login POST/GET, google-callback, me, logout) | Go sudah memiliki `/auth/register`, `login`, `logout`, `validate`, `me`, `google-login`, `google-callback`. Kebijakan `auth-strict` (rate limit) menjadi urusan Go |
| `Services/Identity` (`AumoUserClaimsPrincipalFactory`, `ResendEmailSender`) | Terikat ASP.NET Identity. Tidak ada padanan yang diperlukan |
| Hangfire + `/hangfire` dashboard | Tidak ada job yang terdaftar di sumber |
| Redis cache .NET, Cloudinary | Tidak dipakai oleh controller yang dipindahkan |
| Rust FFI (`RustCoreService`) | FFI .NET→Rust tidak berlaku di Node. Lihat Fase 4 |

### 3.3 Temuan yang harus ditangani

| # | Temuan | Penanganan |
| --- | --- | --- |
| 1 | `JournalEntryService` memakai `PeriodLock` (6 kali), `ITransactionNumberService` (2 kali), dan menulis `GeneralJournals`. `PeriodLock` ada di `ChartOfAccountsModel.cs` (bagian akuntansi) | Aturan ditulis ulang di TypeScript dan dikunci dengan tes paritas terhadap perilaku .NET (Fase 5) |
| 2 | `DashboardService` hanya membaca `ChartOfAccounts`, `GeneralJournals`, dan periode terpilih | Cukup Drizzle. Skema `chart-of-accounts`, `general-journal`, `periods` sudah ada di Nest. Tidak memanggil .NET |
| 3 | `SettingsService` memakai `UserManager` dan `SignInManager` (profil, kata sandi, hapus akun). Pengguna sekarang ada di `auth.users` milik Go (`id uuid`, `name`, `email`, `password_hash`) | `profile`, `change-password`, `delete-account` mengubah `auth.users`. Ketiganya **dilayani Go** (endpoint baru di Go), Nginx merutekannya ke Go. Nest hanya memiliki `avatar` dan `guardian/*` |
| 4 | Guardian memakai tabel `LoginActivity`, `UserSession`, `TrustedDevice`, `RecoveryCode`, `SecuritySetting` yang belum ada di Drizzle. Pencatatan sesi hanya benar bila Go mencatat aktivitas login | Tabel ditambahkan ke Drizzle. Go wajib menulis `login_activities` dan `user_sessions` saat login. Tabel `trusted_devices` dan `recovery_codes` hanya disalin bila fitur 2FA terbukti dipakai |
| 5 | `ToolsService` memakai ClosedXML (template dan impor Excel) | Diganti `exceljs`. Format kolom template dikunci dengan tes |
| 6 | `AvatarsController` publik (`AllowAnonymous`) dan `NeonBucketStorage` memakai S3 | `@aws-sdk/client-s3` sudah ada di `apps/nest`. `GET /api/avatars/*` publik, tanpa `auth_request` di Nginx |
| 7 | `HomeService` memanggil sumber kurs dan indikator pasar lewat `HttpClient` | Diganti `fetch` bawaan Node 24 dengan batas waktu. Cache Redis opsional (fail-open, seperti rate limit Nest) |
| 8 | `CoreController` hanya mengembalikan pesan "salam" dari Rust | Dikembalikan dari TypeScript. Logika Rust diduplikasi ke `native/core_engine` sebagai fungsi biasa |
| 9 | `HealthController` sudah punya padanan di Nest | Selaraskan bentuk respons saja. Tidak ada modul baru |
| 10 | Sumber hanya memiliki satu tes (`CoreControllerTests`) | Tes modul baru dibuat di Fase 8 |

### 3.4 Tabel Drizzle

| Tabel | Status | Dipakai oleh |
| --- | --- | --- |
| `chart_of_accounts`, `general_journal`, `periods`, `transaction_counters` | Sudah ada | `dashboard`, `journal-entries`, `tools` |
| `notifications` | **Baru** | `notifications` |
| `login_activities`, `user_sessions`, `security_settings` | **Baru** | `settings` (guardian) |
| `trusted_devices`, `recovery_codes` | Baru, bersyarat (temuan 4) | `settings` (guardian) |
| `general_ledger_*` | Dibahas di dokumen akuntansi (Fase 5) | `dotnet/` |

## 4. Benturan Konfigurasi (Sumber vs `apps/nest`)

| Aspek | Sumber (.NET) | `apps/nest` | Penanganan |
| --- | --- | --- | --- |
| Tipe `UserId` | `Guid` | `text` pada tabel Drizzle | Simpan `X-User-Id` (uuid) sebagai string. Tidak ada konversi tambahan |
| Penamaan kolom | PascalCase (EF) | `snake_case` (Drizzle) | Nest mengikuti Drizzle. Cocokkan dengan skema Neon nyata sebelum menyentuh data |
| Bentuk respons | `{ success, message, ... }` | Filter exception Nest | Pertahankan bentuk sumber agar klien tidak berubah |
| Validasi | FluentValidation | Zod 4 | Satu skema Zod per request, ditaruh di `<modul>.schemas.ts` |
| Rate limit | `global`, `auth-strict` | Guard Redis fail-open | `global` → guard Nest. `auth-strict` → Go |
| Unggah berkas | `IFormFile` | `@nestjs/platform-express` (`multer`) | Tambah `multer` dan batas ukuran. `client_max_body_size` Nginx saat ini **2m**, cukup untuk avatar, perlu dinaikkan untuk impor Excel (Fase 9) |
| Excel | ClosedXML, ExcelDataReader | belum ada | Tambah `exceljs` |
| Pekerjaan latar | Hangfire | BullMQ | Tidak diperlukan sekarang |

## 5. Struktur Modul Tujuan

Mengikuti pola modul `periods` yang sudah ada:

```
apps/nest/src/modules/<nama>/
  <nama>.module.ts
  <nama>.controller.ts
  <nama>.service.ts
  <nama>.schemas.ts      # Zod: request dan query
  <nama>.types.ts        # tipe respons
apps/nest/src/db/schema/<tabel>.ts   # hanya bila tabel baru
apps/nest/src/test/<nama>.test.ts
```

`app.module.ts` saat ini hanya mengimpor `HealthModule` dan `PeriodsModule`. Setiap modul baru didaftarkan di sana.

## 6. Fase Duplikasi (9 Fase)

### Fase 1 — Baseline & Keputusan

- [ ] Catat commit SHA sumber (`aumo-finance`) sebagai titik acuan salinan.
- [ ] Tetapkan keputusan bagian 2 dan 3.2. Tetapkan siapa yang melayani `profile`, `change-password`, `delete-account` (Go).
- [ ] Catat di `docs/adr/0010-duplikasi-backend-ke-nest.md` (status *Proposed*).
- [ ] **Keluaran:** ADR 0010. **Selesai bila:** daftar 26 endpoint dan pemilik tiap endpoint tertulis.

### Fase 2 — Kerangka dan Konvensi Modul

- [ ] Tambah dependensi: `multer` dan `@types/multer`, `exceljs`.
- [ ] Buat generator kerangka modul (atau template) sesuai bagian 5.
- [ ] Seragamkan bentuk respons dan penanganan error dengan sumber (`{ success, message }`).
- [ ] Guard `X-User-Id` dipakai seragam. Rute publik ditandai eksplisit.
- [ ] **Keluaran:** kerangka modul kosong lolos CI. **Selesai bila:** `lint`, `typecheck`, `test`, `build` hijau.

### Fase 3 — Skema Drizzle Tambahan

- [ ] Tambah tabel `notifications`, `login_activities`, `user_sessions`, `security_settings` (dan `trusted_devices`, `recovery_codes` bila temuan 4 mengharuskan).
- [ ] Cocokkan nama tabel dan kolom dengan Neon nyata sebelum `db:generate`.
- [ ] Migrasi dijalankan manual (`db:migrate`) di Neon, **bukan** dari CI.
- [ ] **Keluaran:** migrasi baru di `apps/nest/drizzle/`. **Selesai bila:** `db:generate` tidak menghasilkan diff lanjutan.

### Fase 4 — Modul Ringan dan Publik

- [ ] `health`: selaraskan bentuk respons dengan `HealthController` sumber.
- [ ] `core`: `GET/POST /core/salam` di TypeScript. Salin logika `axum/src/lib.rs` ke `native/core_engine/src/salam.rs` (fungsi biasa) dengan `cargo test`.
- [ ] `home`: `kurs` dan `market-indicators` memakai `fetch` dengan batas waktu; cache Redis opsional.
- [ ] `notifications`: daftar, tandai satu dibaca, tandai semua dibaca.
- [ ] `avatars`: baca dari bucket S3 (Neon Bucket), publik.
- [ ] Port `CoreControllerTests` ke `src/test/core.test.ts`.
- [ ] **Keluaran:** 9 endpoint aktif. **Selesai bila:** tes modul hijau.

### Fase 5 — Dashboard dan Jurnal

- [ ] `dashboard`: query Drizzle atas `chart_of_accounts`, `general_journal`, periode terpilih.
- [ ] `journal-entries`: `GET {id}`, `POST create`, `PUT edit/{id}`, `DELETE delete/{id}`, `GET search-descriptions`, `GET next-transaction-number`.
- [ ] `PeriodLock` dan nomor transaksi (`transaction_counters`) ditulis di TypeScript.
- [ ] **Tes paritas:** satu set fixture jurnal dijalankan terhadap backend .NET lama dan modul Nest. Hasil (nomor transaksi, penolakan pada periode terkunci) harus identik.
- [ ] **Keluaran:** 7 endpoint aktif. **Selesai bila:** tes paritas hijau.

### Fase 6 — Tools (Impor Jurnal)

- [ ] `GET download-journal-template` memakai `exceljs`. Kolom dan urutan sama dengan template sumber.
- [ ] `POST preview-journal-import` dan `POST import-journal-entries`: validasi baris, keseimbangan debit-kredit, periode, dan kode akun.
- [ ] Impor memakai transaksi database (semua baris masuk atau tidak sama sekali).
- [ ] **Keluaran:** 3 endpoint aktif. **Selesai bila:** berkas contoh menghasilkan jurnal yang sama dengan backend lama.

### Fase 7 — Settings dan Guardian

- [ ] `POST avatar`: unggah ke bucket S3, validasi tipe dan ukuran (setara `AvatarFileValidator`).
- [ ] `guardian/dashboard`, `guardian/revoke-session/{sessionId}`, `guardian/revoke-all-sessions` di Nest.
- [ ] Koordinasi dengan Go: tulis `login_activities` dan `user_sessions` saat login; Go membatalkan sesi yang dicabut pada `/auth/validate`.
- [ ] `profile`, `change-password`, `delete-account`: endpoint dibuat di `services/auth` (Go), Nginx merutekan `/api/settings/{profile,change-password,delete-account}` ke Go. Nest tidak menyentuh `auth.users`.
- [ ] **Keluaran:** 4 endpoint di Nest, 3 di Go. **Selesai bila:** sesi yang dicabut ditolak pada permintaan berikutnya.

### Fase 8 — Kontrak dan Tes

- [ ] Bentuk respons semua modul masuk `libs/contracts` (Zod) dan diselaraskan dengan Rust, C#, dan Kotlin bila berubah (ADR 0004).
- [ ] Tes unit dan integrasi per modul. Mock Redis dan S3 seperti `src/test/setup.ts`.
- [ ] Tes paritas respons terhadap backend lama untuk 26 endpoint pada data yang sama.
- [ ] **Keluaran:** CI memvalidasi semua modul baru. **Selesai bila:** `pnpm nx run-many -t lint typecheck test build` hijau.

### Fase 9 — Gateway, Render, dan Cutover (tanpa penghapusan)

- [ ] `nginx.conf`: `location ^~ /api/avatars/` publik (tanpa `auth_request`); `/api/settings/{profile,change-password,delete-account}` → Go; naikkan `client_max_body_size` untuk impor Excel (misalnya `10m`), hanya pada `location` Tools.
- [ ] `render.yaml`: tambah env untuk S3 (`AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`) sebagai `sync: false`.
- [ ] Uji asap: login (Go) → dashboard → buat jurnal → impor Excel → notifikasi → unggah avatar → cabut sesi.
- [ ] Bandingkan angka dan respons dengan backend aumo-finance pada data yang sama.
- [ ] Perbarui ADR 0010 menjadi *Accepted*, tambah changeset.
- [ ] **Tidak ada** penghapusan di aumo-finance.
- [ ] **Keluaran:** seluruh isi `/backend` memiliki padanan di aumo-typescript. **Selesai bila:** 26 endpoint Nest dan 23 endpoint .NET lolos uji asap.

## 7. Risiko

| Risiko | Dampak | Penanganan |
| --- | --- | --- |
| Aturan akuntansi (`PeriodLock`, nomor transaksi) ada di Nest dan .NET | Selisih perilaku, data jurnal tidak konsisten | Tes paritas Fase 5 dengan fixture bersama. Aturan didokumentasikan di satu tempat |
| `JournalEntry` di Nest menulis tabel yang dibaca laporan .NET | Laporan salah bila skema atau status jurnal berbeda | Satu pemilik skema (Drizzle). Tes lintas layanan di Fase 9 |
| Guardian bergantung pada Go | Sesi dicabut tetapi tetap lolos validasi | Go menolak sesi tercabut di `/auth/validate` (Fase 7). Tanpa itu fitur guardian tidak diaktifkan |
| `change-password` dan `delete-account` pindah ke Go | Perubahan di layanan di luar `apps/nest` | Dicatat sebagai pekerjaan Go di Fase 7 |
| Impor Excel besar | Memori Nest di container bersama (512 MB, 4 proses) | Batas ukuran berkas dan jumlah baris, pemrosesan berbasis transaksi |
| Skema tabel baru tidak cocok dengan Neon | Query gagal | Cocokkan dengan Neon nyata di Fase 3 |
| `exceljs` memperbesar image | Build Docker lebih lama | Dihitung di Fase 2, bukan di akhir |

## 8. Prinsip dari `Note.txt` dan `README.md` Sumber

- Rapikan struktur sebelum memecah sistem: pisahkan domain, aplikasi, infrastruktur, dan API.
- Hindari logika bisnis di controller. Controller Nest hanya memvalidasi dan memanggil service.
- Aturan akuntansi (jurnal, kunci periode, pembaruan buku besar) terpusat dan mudah diuji.
- Batas modul jelas meskipun masih satu aplikasi.
- Semakin banyak logika yang dapat diuji unit, semakin mudah dipisah kelak.
- Bahasa pendukung (Rust, Go, Python) hanya dipakai bila ada kebutuhan nyata. Saat ini seluruh backend berpusat pada satu stack per domain: akuntansi di .NET, sisanya di Nest, auth di Go.
