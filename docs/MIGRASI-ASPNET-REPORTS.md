# Peta Migrasi: `/reports` ASP.NET Core (aumo-finance) → `dotnet/` (aumo-typescript)

> Status: **PEMETAAN SAJA.** Dokumen ini tidak memindahkan atau mengubah kode apa pun.
> Sumber: `github.com/rdmmoonlight/aumo-finance`, folder `backend/asp-net-core` (ASP.NET Core, EF Core, PostgreSQL).
> Tujuan: `github.com/rdmmoonlight/aumo-typescript`, folder `dotnet/` (solution `dotnet/App.sln`).
> Ruang lingkup: **hanya controller `Reports` beserta seluruh kelengkapannya** (service, DTO, view model, model, validator, tes). Sistem akuntansi saja.

---

## 1. Ringkasan Keputusan

| Pos | Keputusan |
| --- | --- |
| Peran ASP.NET Core | Satu-satunya penangan rute laporan akuntansi (`/api/reports/*`) |
| Proyek tujuan | `dotnet/src/Aumo.Reports.Api` (web) dan `dotnet/tests/Aumo.Reports.Tests` (tes). Keduanya masuk `dotnet/App.sln` |
| `apps/nest` | Tetap menangani `/api/*` lainnya (periods, health). Tidak disentuh |
| `services/auth` (Go) | Tetap menjadi satu-satunya otoritas auth (ADR 0006, 0007). ASP.NET **tidak** memakai Identity, cookie, atau JWT sendiri |
| Identitas pengguna | Dibaca dari header `X-User-Id` yang diisi Nginx lewat `auth_request`. Port .NET hanya `127.0.0.1` |
| Skema database | Dimiliki Drizzle di `apps/nest/drizzle/`. EF Core hanya **membaca dan memetakan**. Tanpa `MigrateAsync`, tanpa migrasi EF |
| Rute publik | `/api/reports/*` (Nginx memotong `/api`, .NET menerima `/reports/*`) |
| Target framework | `net10.0` (CI sudah memakai SDK `10.0.x`). `Directory.Build.props` dinaikkan dari `net8.0` |
| Biaya | Nol tambahan. GitHub Actions, Render free tier, Neon |
| Aturan | CI wajib hijau di setiap akhir fase. Tidak ada fase yang boleh merusak workflow yang sudah lolos |

## 2. Inventaris Baseline (`backend/asp-net-core`)

| Kelompok | Isi | Baris |
| --- | --- | --- |
| `Controllers/Reports` | `FinancialStatementsController`, `GeneralLedgersController`, `JournalsController`, `SummaryController`, `TrialBalanceController`, `WorksheetController` | 1.077 |
| `Services/Reports` | `FinancialStatements`, `GeneralLedgers`, `Journals`, `Summary`, `TrialBalances` (2 service), `Worksheet`, beserta interface | 1.452 |
| `DTOs/Reports` | `FinancialStatementsDto`, `GeneralLedgersDto`, `JournalsDto`, `TrialBalancesDto`, `WorksheetDto` | 1.179 |
| `ViewModels/Reports` | 5 file | 655 |
| `Models/Reports` | 6 file, hampir seluruhnya kosong (26 baris) | 26 |
| Total | | **4.389** |

### 2.1 Rute yang berlaku sekarang

| Controller | Rute | Metode |
| --- | --- | --- |
| `FinancialStatementsController` | `/reports/income-statement` | GET |
| | `/reports/retained-earnings` | GET |
| | `/reports/statement-of-cash-flow` | GET |
| | `/reports/statement-of-financial-position` | GET |
| `GeneralLedgersController` | `/reports/general-ledgers/permanent` | GET |
| | `/reports/general-ledgers/temporary` | GET |
| | `/reports/general-ledgers/refresh` | POST |
| `JournalsController` (kelas `JournalController`) | `/reports/journals/general` | GET |
| | `/reports/journals/adjusting` | GET |
| | `/reports/journals/adjusting/{id:int}` | DELETE |
| | `/reports/journals/closing` | GET |
| `WorksheetController` | `/reports/worksheet` | GET |
| `SummaryController` | `/summary` (di luar `/reports`) | GET |
| `TrialBalanceController` | `/trialbalance` (tanpa endpoint) | tidak ada |

### 2.2 Temuan yang harus ditangani saat memindahkan

| # | Temuan | Penanganan |
| --- | --- | --- |
| 1 | `TrialBalanceController` tidak punya endpoint. Isinya dua method statis yang selalu mengembalikan list kosong | Dibuang. Kalkulasi trial balance tetap lewat `ITrialBalanceService` |
| 2 | Ada dua service trial balance: `TrialBalanceService` (dipakai Worksheet) dan `TrialBalancesService` | Pilih satu di Fase 3, yang lain dihapus. Jangan salin keduanya |
| 3 | `SummaryController` memakai rute `/summary`, bukan `/reports/summary` | Rute dinormalisasi ke `/reports/summary`. Alias lama dipertahankan di Nginx sampai klien diperbarui |
| 4 | Nama kelas `JournalController` tidak sama dengan nama file `JournalsController.cs` | Samakan menjadi `JournalsController` |
| 5 | `SelectedPeriodHelper` punya overload `object` sebagai "safety fallback" | Hanya overload bertipe kuat yang disalin |
| 6 | `GeneralLedgersController.refresh` (POST) mengubah data | Wajib punya tes integrasi sebelum cutover |
| 7 | `SummaryController` memakai `UserManager<ApplicationUser>` | Diganti pembaca `X-User-Id` (Fase 4). `ApplicationUser` tidak dipindahkan |
| 8 | Hanya ada satu tes di sumber (`CoreControllerTests`), tidak ada tes untuk `Reports` | Tes dibuat baru di Fase 7 |
| 9 | Header file memakai `PlaceholderCompany` | Dibersihkan agar lolos StyleCop (lihat bagian 3) |

### 2.3 Ketergantungan bersama yang ikut dipindahkan

| Jenis | Item | Catatan |
| --- | --- | --- |
| Model EF | `Period`, `ChartOfAccount`, `GeneralJournal`, `GeneralLedgerPermanentAccount`, `GeneralLedgerTemporaryAccount` | Hanya 5 entitas ini |
| DbContext | `AppDbContext` versi ramping | 5 `DbSet` saja. Tanpa Identity, Hangfire, DataProtection |
| Helper | `SelectedPeriodHelper` | Periode terpilih ditentukan lewat `IsSelected` per pengguna |
| DTO bersama | `SummaryDto` | Dipakai `SummaryService` |

### 2.4 Tidak ikut dipindahkan

`AuthController`, `Services/Auth`, `Services/Identity`, Identity/JWT/Google di `ServiceCollectionExtensions`, Hangfire, Redis cache, Cloudinary, AWS S3, ClosedXML, ExcelDataReader, FFI Rust (`../axum`), `Migrations/`, serta controller non-laporan (`Periods`, `JournalEntry`, `ChartOfAccounts`, `Dashboard`, `Tools`, dan lainnya).

## 3. Benturan Konfigurasi (Sumber vs Repo Tujuan)

| Aspek | Sumber (`aumo-finance`) | `aumo-typescript` (sekarang) | Dampak dan penanganan |
| --- | --- | --- | --- |
| Framework | `net10.0` | `Directory.Build.props`: `net8.0` | Dinaikkan ke `net10.0` (Fase 2) |
| Paket preview | `10.0.0-preview.*` (EF, Npgsql, Identity) | Tidak ada | Pakai rilis stabil `10.0.x`. Tidak ada paket preview |
| Analyzer | Roslynator, tanpa `TreatWarningsAsErrors` | StyleCop + `TreatWarningsAsErrors=true` + `GenerateDocumentationFile` | Kode sumber akan gagal build. Rapikan header, XML doc, dan urutan `using`. Aturan yang tidak relevan dimatikan di `.editorconfig`, bukan lewat `NoWarn` global |
| Autentikasi | Identity cookie + JWT Bearer | Go auth + Nginx `auth_request` | Seluruh atribut `[Authorize(AuthenticationSchemes = ...)]` diganti satu skema internal (Fase 4) |
| Tipe `UserId` | `Guid` | Go `auth.users.id` bertipe `uuid`. Nest memakai `text` | Parse `X-User-Id` ke `Guid`. Kolom `user_id` di tabel bertipe `text`, jadi konversi dipetakan eksplisit |
| Penamaan tabel/kolom | PascalCase (EF) | Drizzle: `snake_case` | **Titik keputusan Fase 5.** Cocokkan dengan skema Neon yang nyata sebelum memetakan |
| Rute | Absolut (`/reports/...`), tanpa `/api` | Nginx memotong `/api` | Cocok. Rute .NET tetap `/reports/*` |
| Port | `PORT` Render | Nginx di `$PORT`, Go `8080`, Nest `5000` | .NET memakai `5100`, hanya loopback |
| Dokumentasi API | `MapOpenApi` + Scalar | Scalar sudah ada di Nest (`/api/reference`) | Scalar .NET di `/api/reports/reference` (Fase 6) |
| CI | tidak ada | `polyglot-ci.yml` hanya `dotnet build` | Tambah `dotnet test` (Fase 7) |
| Memori Render | satu proses .NET | 3 proses (Nginx, Go, Nest) dalam satu container | Proses ke-4 menambah beban memori. Dicatat sebagai risiko (bagian 6) |

## 4. Fase Migrasi (9 Fase)

### Fase 1 — Baseline & Keputusan

- [ ] Bekukan perubahan baru pada `Controllers/Reports`, `Services/Reports`, `DTOs/Reports`, `ViewModels/Reports` di aumo-finance selama migrasi.
- [ ] Tetapkan keputusan: auth dipegang Go, .NET membaca `X-User-Id`; skema dipegang Drizzle, EF hanya membaca.
- [ ] Catat di `docs/adr/0009-aspnet-reports-masuk-monorepo.md` (status *Proposed*).
- [ ] Catat commit SHA sumber sebagai titik acuan migrasi.
- [ ] **Keluaran:** ADR 0009. **Selesai bila:** otoritas auth, pemilik skema, dan daftar rute tertulis.

### Fase 2 — Penyelarasan Toolchain .NET (belum ada kode laporan)

- [ ] `Directory.Build.props`: `TargetFramework` → `net10.0`.
- [ ] `.editorconfig` di `dotnet/`: matikan aturan StyleCop yang bertabrakan dengan gaya sumber (header file, urutan `using`), satu per satu dengan alasan tertulis.
- [ ] Buat `Aumo.Reports.Api` (kosong, `Microsoft.NET.Sdk.Web`) dan `Aumo.Reports.Tests` (xUnit), tambahkan ke `dotnet/App.sln`.
- [ ] `polyglot-ci.yml`: build `dotnet/App.sln` tetap hijau.
- [ ] **Keluaran:** solusi kosong terbangun di CI. **Selesai bila:** `dotnet build` dengan `TreatWarningsAsErrors=true` lolos.

### Fase 3 — Salin dan Rapikan Kode

- [ ] Salin sesuai bagian 2.3: model, `AppDbContext` ramping, `SelectedPeriodHelper`, `Services/Reports`, `DTOs/Reports`, `ViewModels/Reports`, `Controllers/Reports`.
- [ ] Ganti namespace `AumoBackend.*` → `Aumo.Reports.Api.*`.
- [ ] Terapkan temuan 1 sampai 5 dan 9 (bagian 2.2). Buang `Models/Reports` yang kosong.
- [ ] Daftarkan service di satu `AddReportsServices()` (pengganti `AddApplicationServices`).
- [ ] Validator dipindahkan hanya bila dipakai laporan. Dari hasil inventaris, `Validators/Queries/*` yang dipakai laporan disalin, sisanya tidak.
- [ ] **Keluaran:** `Aumo.Reports.Api` terbangun. **Selesai bila:** `dotnet build` lolos tanpa kode `Identity`, `Hangfire`, `Redis`, atau `Rust`.

### Fase 4 — Autentikasi via Gateway

- [ ] Satu skema autentikasi internal (`GatewayHeader`) yang membaca `X-User-Id`, mengubahnya ke `Guid`, lalu membentuk `ClaimTypes.NameIdentifier`.
- [ ] Tanpa header atau header tidak valid → `401` dengan bentuk `{"success":false,"message":"Unauthorized"}` (sama dengan `@unauthorized` di Nginx).
- [ ] Ganti semua `[Authorize(AuthenticationSchemes = "Identity.Application,Bearer")]` dengan `[Authorize]`.
- [ ] Hapus `UserManager` dari `SummaryController`.
- [ ] Kestrel hanya mendengarkan `127.0.0.1:5100`. Header `X-User-Id` dari luar tidak pernah sampai, karena Nginx selalu menimpanya.
- [ ] **Keluaran:** semua endpoint terlindungi. **Selesai bila:** tes menunjukkan tanpa header = 401, header sah = 200.

### Fase 5 — Data Layer dan Skema

- [ ] Ambil skema nyata dari Neon (`information_schema.columns`) untuk 5 tabel. Hasilnya menjadi acuan, bukan tebakan.
- [ ] Petakan nama tabel dan kolom di `OnModelCreating` agar cocok dengan skema nyata (PascalCase atau `snake_case`). Satu konvensi, tidak dicampur.
- [ ] Petakan `UserId` `Guid` ↔ kolom `text` (value converter).
- [ ] Tanpa `Database.MigrateAsync()` dan tanpa folder `Migrations/`. Perubahan skema lewat Drizzle dan dijalankan manual, bukan dari CI.
- [ ] Koneksi memakai `DATABASE_URL` yang sama dengan Nest. Konversi format URL → connection string Npgsql dilakukan di satu tempat.
- [ ] **Keluaran:** catatan pemetaan skema di `docs/`. **Selesai bila:** query baca tiap tabel berhasil di Neon pengembangan.

### Fase 6 — Rute dan Kontrak

- [ ] Rute final: `/reports/income-statement`, `/reports/retained-earnings`, `/reports/statement-of-cash-flow`, `/reports/statement-of-financial-position`, `/reports/general-ledgers/{permanent,temporary,refresh}`, `/reports/journals/{general,adjusting,closing}`, `DELETE /reports/journals/adjusting/{id}`, `/reports/worksheet`, `/reports/summary`.
- [ ] Endpoint publik `/health` dan `/reports/health`, serta OpenAPI + Scalar (diteruskan Nginx sebagai `/api/reports/reference` dan `/api/reports/openapi.json`).
- [ ] Kontrak respons laporan ditambahkan ke `libs/contracts` (Zod) dan disalin ke DTO C# (kewajiban ADR 0004).
- [ ] Tidak ada perubahan bentuk respons dari sumber, kecuali yang tercatat di dokumen ini.
- [ ] **Keluaran:** daftar rute dan kontrak final di `docs/`. **Selesai bila:** Scalar menampilkan semua rute dan kontrak Zod lolos `pnpm typecheck`.

### Fase 7 — Tes dan Gerbang CI

- [ ] Tes unit untuk `Services/Reports` (perhitungan trial balance, worksheet, laba rugi, posisi keuangan, arus kas).
- [ ] Tes integrasi controller dengan PostgreSQL nyata (Testcontainers) untuk 13 endpoint, termasuk `DELETE adjusting` dan `POST refresh`.
- [ ] Tes aturan akuntansi yang sudah tercatat: periode ditentukan oleh `EntryDate` dalam rentang `StartDate`–`EndDate`; jurnal penutup dihitung langsung dari trial balance dan tidak disimpan.
- [ ] `polyglot-ci.yml`: tambah `dotnet test dotnet/App.sln`.
- [ ] **Keluaran:** CI memvalidasi laporan. **Selesai bila:** build dan tes .NET hijau di GitHub Actions.

### Fase 8 — Gateway, Docker, dan Render

- [ ] `nginx.conf`: tambah `location ^~ /api/reports/` **sebelum** `/api/`. Isinya `auth_request /_validate`, `X-User-Id`, `rewrite ^/api/(.*) /$1 break;`, `proxy_pass http://127.0.0.1:5100;`, preflight `OPTIONS` ditangani seperti blok Nest.
- [ ] Rute publik: `/api/reports/health`, `/api/reports/reference`, `/api/reports/openapi.json` tanpa `auth_request`.
- [ ] Alias sementara `/api/summary` → `/reports/summary`.
- [ ] `Dockerfile`: tahap baru `builder-dotnet` (`mcr.microsoft.com/dotnet/sdk:10.0-alpine`, `dotnet publish -c Release -r linux-musl-x64 --self-contained -p:PublishTrimmed=true -p:InvariantGlobalization=true`). Salin hasilnya ke image akhir, tambahkan `apk add libstdc++ libgcc`.
- [ ] `supervisord.conf`: tambah `[program:dotnet-reports]` dengan `ASPNETCORE_URLS=http://127.0.0.1:5100`.
- [ ] `render.yaml`: tambah `dotnet/**` ke `buildFilter`. Env `DATABASE_URL` yang sama dipakai bersama.
- [ ] **Keluaran:** satu image berisi Nginx, Go, Nest, dan .NET. **Selesai bila:** `/api/reports/health` membalas 200 di Render.

### Fase 9 — Cutover dan Pembersihan

- [ ] Uji asap berurutan: login (Go) → pilih periode (Nest) → seluruh endpoint laporan → bandingkan angka dengan backend lama pada data yang sama.
- [ ] Frontend (`apps/analog`) memakai `/api/reports/*`.
- [ ] Hapus `Controllers/Reports` dan kelengkapannya dari aumo-finance **hanya setelah persetujuan tertulis**.
- [ ] Hapus alias `/api/summary`.
- [ ] Perbarui ADR 0009 menjadi *Accepted*, tambah changeset.
- [ ] **Keluaran:** satu sumber kebenaran untuk rute laporan. **Selesai bila:** aumo-finance bebas dari `Reports` dan angka laporan identik.

## 5. Alur Gateway Setelah Migrasi

```
Browser ──► Nginx ($PORT)
              ├─ /api/auth/*                         → Go auth   (127.0.0.1:8080)
              ├─ /api/reports/{health,reference,openapi.json} → .NET (127.0.0.1:5100, publik)
              ├─ /api/reports/*   → auth_request → Go /auth/validate → .NET (127.0.0.1:5100, prefix /api dipotong)
              ├─ /api/{health,reference,openapi.json}        → Nest (publik)
              └─ /api/*           → auth_request → Go /auth/validate → Nest (127.0.0.1:5000)
```

Urutan blok `location` penting: `^~ /api/reports/` harus berada di atas `/api/`, agar tidak diambil blok Nest.

## 6. Risiko

| Risiko | Dampak | Penanganan |
| --- | --- | --- |
| Memori container Render free tier (512 MB) dengan 4 proses | Proses di-kill (OOM) | Publish trimmed, `DOTNET_GCHeapHardLimit`, ukur sebelum cutover. Bila tidak cukup, pisahkan jadi service Render tersendiri |
| Nama tabel/kolom EF tidak cocok dengan skema Drizzle | Query gagal atau salah kolom | Fase 5 mengacu pada skema nyata, bukan sumber kode |
| Angka laporan berbeda dari backend lama | Kesalahan akuntansi | Perbandingan angka pada data identik di Fase 9, sebelum sumber dihapus |
| Duplikasi logika bisnis antara Nest (periods) dan .NET (laporan) | Perilaku periode tidak sinkron | Periode terpilih tetap dibaca dari tabel yang sama. Aturan periode hanya ditulis di satu tempat (Nest) |
| `TreatWarningsAsErrors` menolak kode sumber | CI merah di Fase 3 | Rapikan bertahap di Fase 3, bukan mematikan analyzer secara global |

## 7. Variabel Lingkungan (.NET)

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ya | Sama dengan Nest. Dikonversi ke connection string Npgsql |
| `ASPNETCORE_URLS` | ya | `http://127.0.0.1:5100` |
| `ASPNETCORE_ENVIRONMENT` | tidak | `Production` di Render |

Tidak ada secret baru. `JWT_SECRET` dan sejenisnya tidak dipakai .NET.
