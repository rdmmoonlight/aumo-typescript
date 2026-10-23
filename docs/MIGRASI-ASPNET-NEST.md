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
| `asp-net-core`: `Health`, `Home`, `Dashboard`, `Notifications`, `Avatars`, `JournalEntry`, `Tools`, `Settings` (tanpa `guardian/*`) + kelengkapannya | `apps/nest/src/modules/*` | **dokumen ini** |
| `asp-net-core`: `CoreController` + `RustCoreService` | **Tidak disalin.** Dead code di sumber (lihat catatan di bawah tabel) | dokumen ini |
| `asp-net-core`: `guardian/*` di `SettingsController` + tabel Guardian | **Tidak disalin.** Fitur guardian tidak diduplikasi ke Nest | dokumen ini, Fase 7 |
| `asp-net-core`: `Auth` + `Services/Auth`, `Services/Identity` | Tidak disalin. Sudah ditangani `services/auth` (Go) | ADR 0006, 0007 |
| `asp-net-core/Tests/Controllers/CoreControllerTests.cs` | Tidak disalin. Mengikuti `CoreController` | dokumen ini |
| `asp-net-core/Migrations/` | Tidak disalin. Skema dimiliki Drizzle | `MIGRASI-ASPNET-ACCOUNTING.md`, Fase 5 |
| `axum/` (Rust, `cdylib`, `get_salam`) | Tidak disalin. Hanya dipakai `CoreController` yang tidak diduplikasi | dokumen ini |
| `go/Test.txt`, `python/Test.txt` | Placeholder tanpa kode. Tidak ada yang disalin. Padanan Go sudah ada: `services/auth` | dokumen ini |
| `Dockerfile` (backend) | Tidak disalin. Digantikan `Dockerfile` root | `MIGRASI-ASPNET-ACCOUNTING.md`, Fase 8 |
| `Backend.slnx` | Tidak disalin. Digantikan `dotnet/App.sln` | `MIGRASI-ASPNET-ACCOUNTING.md`, Fase 2 |
| `README.md`, `Note.txt` | Ringkasan prinsip ada di bagian 8 | dokumen ini |

> **Catatan cakupan (keputusan pemilik repo).**
>
> - `CoreController` (`/api/core/salam`, GET dan POST), `RustCoreService`, `CoreControllerTests`, dan `axum/` **tidak diduplikasi.** Di sumber semuanya *dead code*: tidak dipakai klien mana pun. Tidak ada modul `core` di Nest.
> - `guardian/*` di `SettingsController` (3 endpoint) beserta tabel `login_activities`, `user_sessions`, `security_settings`, `trusted_devices`, `recovery_codes` **tidak diduplikasi.**
> - Akibatnya cakupan endpoint turun dari 26 menjadi **21** (26 − 2 `core` − 3 `guardian`). Pemilik tiap endpoint tertulis di ADR 0010.

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

### 3.1 Controller yang diduplikasi ke Nest (8 controller, 21 endpoint; sumber memiliki 9 controller, 26 endpoint)

| Controller sumber | Baris | Rute sumber | Modul Nest | Metode |
| --- | --- | --- | --- | --- |
| `HealthController` | 80 | `/health` | `health` (**sudah ada**) | GET |
| `CoreController` | 102 | `/api/core/salam` | **tidak diduplikasi** (dead code di sumber) | GET, POST |
| `HomeController` (2 kelas) | 176 | `/kurs`, `/home/market-indicators` | `home` | GET ×2 |
| `DashboardController` | 261 | `/dashboard` | `dashboard` | GET |
| `NotificationsController` | 138 | `/notifications`, `/notifications/{id:guid}/read`, `/notifications/read-all` | `notifications` | GET, PUT ×2 |
| `AvatarsController` | 51 | `/avatars/{fileName}` (publik) | `avatars` | GET |
| `JournalEntryController` | 399 | `/journal-entry/{id}`, `create`, `edit/{id}`, `delete/{id}`, `search-descriptions`, `next-transaction-number` | `journal-entries` | GET ×3, POST, PUT, DELETE |
| `ToolsController` | 396 | `/tools/download-journal-template`, `preview-journal-import`, `import-journal-entries` | `tools` | GET, POST ×2 |
| `SettingsController` | 312 | `/settings/profile`, `avatar`, `change-password`, `delete-account`; `guardian/*` (3 endpoint) **tidak diduplikasi** | `settings` (hanya `avatar`); sisanya Go | PUT, POST ×4 (+ GET, DELETE guardian, tidak diduplikasi) |
| **Total** | **1.915** | | | **26 endpoint sumber, 21 dipetakan** |

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
| 4 | ~~Guardian memakai tabel `LoginActivity`, `UserSession`, `TrustedDevice`, `RecoveryCode`, `SecuritySetting` yang belum ada di Drizzle. Pencatatan sesi hanya benar bila Go mencatat aktivitas login | Tabel ditambahkan ke Drizzle. Go wajib menulis `login_activities` dan `user_sessions` saat login. Tabel `trusted_devices` dan `recovery_codes` hanya disalin bila fitur 2FA terbukti dipakai~~ **Tidak berlaku.** Guardian tidak diduplikasi, jadi tabel dan pekerjaan di Go tidak diperlukan |
| 5 | `ToolsService` memakai ClosedXML (template dan impor Excel) | Diganti `exceljs`. Format kolom template dikunci dengan tes |
| 6 | `AvatarsController` publik (`AllowAnonymous`) dan `NeonBucketStorage` memakai S3 | `@aws-sdk/client-s3` sudah ada di `apps/nest`. `GET /api/avatars/*` publik, tanpa `auth_request` di Nginx |
| 7 | `HomeService` memanggil sumber kurs dan indikator pasar lewat `HttpClient` | Diganti `fetch` bawaan Node 24 dengan batas waktu. Cache Redis opsional (fail-open, seperti rate limit Nest) |
| 8 | `CoreController` hanya mengembalikan pesan "salam" dari Rust | **Tidak diduplikasi.** Dead code di sumber |
| 9 | `HealthController` sudah punya padanan di Nest | Selaraskan bentuk respons saja. Tidak ada modul baru |
| 10 | Sumber hanya memiliki satu tes (`CoreControllerTests`) | Tes modul baru dibuat di Fase 8 |

### 3.4 Tabel Drizzle

| Tabel | Status | Dipakai oleh |
| --- | --- | --- |
| `chart_of_accounts`, `general_journal`, `periods`, `transaction_counters` | **Ditambahkan di Fase 5** (snake_case, migrasi `0000`). Tabel EF di Neon masih PascalCase dan perlu disalin (Fase 9) | `dashboard`, `journal-entries`, `tools` |
| `notifications` | **Baru** | `notifications` |
| `login_activities`, `user_sessions`, `security_settings`, `trusted_devices`, `recovery_codes` | **Tidak dibuat.** Guardian tidak diduplikasi | - |
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

`app.module.ts` mengimpor semua modul. Setiap modul baru didaftarkan di sana.

## 6. Fase Duplikasi (9 Fase)

### Fase 1 — Baseline & Keputusan

- [x] Catat commit SHA sumber (`aumo-finance`) sebagai titik acuan salinan.
- [x] Tetapkan keputusan bagian 2 dan 3.2. Tetapkan siapa yang melayani `profile`, `change-password`, `delete-account` (Go).
- [x] Catat di `docs/adr/0010-duplikasi-backend-ke-nest.md` (status *Proposed*).
- [x] **Keluaran:** ADR 0010. **Selesai bila:** daftar endpoint dan pemilik tiap endpoint tertulis. (21 endpoint dipetakan; `core` dan `guardian` dikeluarkan dari cakupan. Lihat bagian *Daftar Endpoint dan Pemilik* di ADR 0010.)

### Fase 2 — Kerangka dan Konvensi Modul

- [x] Tambah dependensi: `multer` dan `@types/multer`, `exceljs`.
- [x] Buat generator kerangka modul (atau template) sesuai bagian 5.
- [x] Seragamkan bentuk respons dan penanganan error dengan sumber (`{ success, message }`).
- [x] Guard `X-User-Id` dipakai seragam. Rute publik ditandai eksplisit.
- [x] **Keluaran:** kerangka modul kosong lolos CI. **Selesai bila:** `lint`, `typecheck`, `test`, `build` hijau.

### Fase 3 — Skema Drizzle Tambahan

- [x] Tambah tabel `notifications`. Tabel guardian (`login_activities`, `user_sessions`, `security_settings`, `trusted_devices`, `recovery_codes`) tidak dibuat karena guardian tidak diduplikasi.
- [x] Cocokkan nama tabel dan kolom dengan Neon nyata sebelum `db:generate`.
- [x] Migrasi dijalankan manual (`db:migrate`) di Neon, **bukan** dari CI.
- [x] **Keluaran:** migrasi baru di `apps/nest/src/db/schema/` (sebelumnya `apps/nest/drizzle/`). **Selesai bila:** `db:generate` tidak menghasilkan diff lanjutan.

### Fase 4 — Modul Ringan dan Publik

- [x] `health`: selaraskan bentuk respons dengan `HealthController` sumber.
- [x] `core`: **tidak diduplikasi.** Dead code di sumber (`CoreController`, `RustCoreService`, `axum/`). Tidak ada modul `core` dan tidak ada `salam.rs`.
- [x] `home`: `kurs` dan `market-indicators` memakai `fetch` dengan batas waktu; cache Redis opsional.
- [x] `notifications`: daftar, tandai satu dibaca, tandai semua dibaca.
- [x] `avatars`: baca dari bucket S3 (Neon Bucket), publik.
- [x] `CoreControllerTests`: **tidak diport.** Mengikuti `core`. Tes Fase 4 dibuat untuk `health`, `home`, `notifications`, dan `avatars`.
- [x] **Keluaran:** 7 endpoint aktif (`health` 1, `home` 2, `notifications` 3, `avatars` 1; semula 9, dikurangi 2 endpoint `core`). **Selesai bila:** tes modul hijau. (24 tes lulus: `health`, `home`, `notifications`, `avatars`.)

### Fase 5 — Dashboard dan Jurnal

- [x] `dashboard`: query Drizzle atas `chart_of_accounts`, `general_journal`, periode terpilih.
- [x] `journal-entries`: `GET {id}`, `POST create`, `PUT edit/{id}`, `DELETE delete/{id}`, `GET search-descriptions`, `GET next-transaction-number`.
- [x] **Tes paritas:** satu set fixture jurnal (45 langkah) di `apps/nest/src/test/fixtures/journal-parity.ts`, dijalankan lewat HTTP terhadap modul Nest dan PostgreSQL nyata (`journal-parity.test.ts`). Hasil acuan (nomor transaksi, penolakan periode terkunci, pesan galat) ditetapkan dari kode .NET sumber, lalu dikunci dengan uji mutasi. Menjalankan fixture yang sama terhadap instance .NET hidup belum dilakukan (sandbox tanpa akses NuGet); dijadwalkan di Fase 9.
- [x] **Keluaran:** 7 endpoint aktif (`dashboard` 1, `journal-entries` 6). **Selesai bila:** tes paritas hijau. (74 tes Fase 5 lulus: 17 unit, 45 paritas jurnal, 12 dashboard.)

Catatan Fase 5:
- Draf sebelumnya (`dashboard`, `journal-entries`) tidak sesuai sumber: skema tidak ada, nomor transaksi memakai format `JE-yyyymm-0001` (aslinya `GJ`/`AJ` + `yyMM` + 4 digit dari `transaction_counters`), dan 28 galat typecheck. Keduanya ditulis ulang dari `JournalEntryController`, `TransactionNumberService`, `PeriodLock`, `JournalEntryValidatorBase`, dan `DashboardController`.
- Skema Drizzle ditambahkan: `chart_of_accounts`, `general_journal` (+ sequence `general_journal_journal_entry_id_seq`), `periods`, `transaction_counters`. Migrasi `apps/nest/src/db/schema/0000_*.sql` (folder keluaran `drizzle.config.ts` saat ini) juga memuat `notifications` (menutup celah Fase 3).
- Tes integrasi butuh `TEST_DATABASE_URL`; tanpa itu dilewati. CI menyediakan PostgreSQL 16.
- Dashboard memakai bentuk `DashboardController` (id akun berupa angka), bukan DTO `DashboardService` yang tidak dipakai di sumber.
- Selisih kecil yang diketahui: angka desimal dikirim sebagai angka JSON biasa (`100000`, bukan `100000.00` seperti decimal .NET). Nilainya sama.

### Fase 6 — Tools (Impor Jurnal)

- [x] `GET download-journal-template` memakai `exceljs`. Kolom dan urutan sama dengan template sumber.
- [x] `POST preview-journal-import` dan `POST import-journal-entries`: validasi baris, keseimbangan debit-kredit, periode, dan kode akun.
- [x] Impor memakai transaksi database (semua baris masuk atau tidak sama sekali).
- [ ] **Keluaran:** 3 endpoint aktif. **Selesai bila:** berkas contoh menghasilkan jurnal yang sama dengan backend lama.

### Fase 7 — Settings dan Guardian (hapus guardian)

- [x] Guardian dan kelengkapannya tidak di duplikasi di /nest
- [x] `POST avatar`: unggah ke bucket S3, validasi tipe dan ukuran (setara `AvatarFileValidator`).
- [x] `profile`, `change-password`, `delete-account`: endpoint dibuat di `services/auth` (Go), Nginx merutekan `/api/settings/{profile,change-password,delete-account}` ke Go. Nest tidak menyentuh `auth.users`.
- [ ] **Keluaran:** endpoint di Nest, di Go. **Selesai bila:** aman

### Fase 8 — Kontrak dan Tes

- [x] Bentuk respons semua modul masuk `libs/contracts` (Zod) dan diselaraskan dengan Rust, C#, dan Kotlin bila berubah (ADR 0004).
- [ ] Tes unit dan integrasi per modul. Mock Redis dan S3 seperti `src/test/setup.ts`.
- [ ] Tes paritas respons terhadap backend lama untuk endpoint pada data yang sama.
- [ ] **Keluaran:** CI memvalidasi semua modul baru. **Selesai bila:** `pnpm nx run-many -t lint typecheck test build` hijau.

### Fase 9 — Gateway, Render, dan Cutover (tanpa penghapusan)

- [x] `nginx.conf`: `location ^~ /api/avatars/` publik (tanpa `auth_request`); `/api/settings/{profile,change-password,delete-account}` → Go; naikkan `client_max_body_size` untuk impor Excel (misalnya `10m`), hanya pada `location` Tools.
- [x] `render.yaml`: tambah env untuk S3 (`AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`) sebagai `sync: false`.
- [ ] Uji asap: login (Go) → dashboard → buat jurnal → impor Excel → notifikasi → unggah avatar → cabut sesi.
- [ ] Bandingkan angka dan respons dengan backend aumo-finance pada data yang sama. Termasuk menjalankan fixture `journal-parity.ts` terhadap instance .NET hidup.
- [ ] Salin data tabel EF PascalCase ke tabel Drizzle (`chart_of_accounts`, `general_journal`, `periods`, `transaction_counters`, `notifications`), lalu set `general_journal_journal_entry_id_seq` ke `MAX(journal_entry_id)` dan pastikan `transaction_counters` mengikuti nomor terakhir.
- [ ] Perbarui ADR 0010 menjadi *Accepted*, tambah changeset.
- [ ] **Tidak ada** penghapusan di aumo-finance.
- [ ] **Keluaran:** seluruh isi `/backend` memiliki padanan di aumo-typescript. **Selesai bila:**  endpoint Nest dan endpoint .NET lolos uji asap.

## 7. Risiko

| Risiko | Dampak | Penanganan |
| --- | --- | --- |
| Aturan akuntansi (`PeriodLock`, nomor transaksi) ada di Nest dan .NET | Selisih perilaku, data jurnal tidak konsisten | Tes paritas Fase 5 dengan fixture bersama. Aturan didokumentasikan di satu tempat |
| `JournalEntry` di Nest menulis tabel yang dibaca laporan .NET | Laporan salah bila skema atau status jurnal berbeda | Satu pemilik skema (Drizzle). Tes lintas layanan di Fase 9 |
| Guardian bergantung pada Go | Sesi dicabut tetapi tetap lolos validasi | Go menolak sesi tercabut di `/auth/validate` (Fase 7). Tanpa itu fitur guardian tidak diaktifkan |
| `change-password` dan `delete-account` pindah ke Go | Perubahan di layanan di luar `apps/nest` | Dicatat sebagai pekerjaan Go di Fase 7 |
| Impor Excel besar | Memori Nest di container bersama (512 MB, 4 proses) | Batas ukuran berkas dan jumlah baris, pemrosesan berbasis transaksi |
| Skema tabel baru tidak cocok dengan Neon | Query gagal | Cocokkan dengan Neon nyata di Fase 3 |
| Neon berisi tabel EF PascalCase (`"GeneralJournal"`, `"ChartOfAccounts"`, `"Periods"`, `"TransactionCounters"`, `"Notifications"`), sedangkan Drizzle memakai `snake_case` | Nest membaca tabel kosong; counter nomor transaksi mulai dari 1 sehingga nomor bisa bentrok dengan data lama | Salin data lama (`INSERT ... SELECT`) dan set sequence/counter sebelum cutover (Fase 9) |
| `exceljs` memperbesar image | Build Docker lebih lama | Dihitung di Fase 2, bukan di akhir |

## 8. Prinsip dari `Note.txt` dan `README.md` Sumber

- Rapikan struktur sebelum memecah sistem: pisahkan domain, aplikasi, infrastruktur, dan API.
- Hindari logika bisnis di controller. Controller Nest hanya memvalidasi dan memanggil service.
- Aturan akuntansi (jurnal, kunci periode, pembaruan buku besar) terpusat dan mudah diuji.
- Batas modul jelas meskipun masih satu aplikasi.
- Semakin banyak logika yang dapat diuji unit, semakin mudah dipisah kelak.
- Bahasa pendukung (Rust, Go, Python) hanya dipakai bila ada kebutuhan nyata. Saat ini seluruh backend berpusat pada satu stack per domain: akuntansi di .NET, sisanya di Nest, auth di Go.
