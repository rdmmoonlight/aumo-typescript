# Peta Migrasi: Akuntansi ASP.NET Core (aumo-finance) → `dotnet/` (aumo-typescript)

> Status: **PEMETAAN SAJA.** Dokumen ini tidak memindahkan atau mengubah kode apa pun.
> Sumber: `github.com/rdmmoonlight/aumo-finance`, folder `backend/asp-net-core` (ASP.NET Core, EF Core, PostgreSQL).
> Tujuan: `github.com/rdmmoonlight/aumo-typescript`, folder `dotnet/` (solution `dotnet/App.sln`).
> Ruang lingkup: **sistem akuntansi penuh** = controller `Reports`, `Periods`, dan `ChartOfAccounts` beserta seluruh kelengkapannya (service, DTO, view model, model, validator, tes).
> Pola: **duplikasi.** Kode disalin ke aumo-typescript. Sumber di aumo-finance dan modul terkait di `apps/nest` **tidak dihapus**.

---

## 1. Ringkasan Keputusan

| Pos | Keputusan |
| --- | --- |
| Peran ASP.NET Core | Satu-satunya penangan rute akuntansi: `/api/reports/*`, `/api/periods/*`, `/api/chart-of-accounts/*` |
| Proyek tujuan | `dotnet/Aumo.Accounting.Api` (web) dan `dotnet/Aumo.Accounting.Tests` (tes). Keduanya masuk `dotnet/App.sln` |
| Penghapusan | **Tidak ada.** Sumber di aumo-finance tetap. Modul `periods` dan `chart-of-accounts` di `apps/nest` tetap ada di kode, hanya tidak dirutekan oleh Nginx |
| `apps/nest` | Tetap menangani `/api/*` yang bukan akuntansi (mis. health). Tidak diubah |
| `services/auth` (Go) | Tetap satu-satunya otoritas auth (ADR 0006, 0007). ASP.NET **tidak** memakai Identity, cookie, atau JWT sendiri |
| Identitas pengguna | Dibaca dari header `X-User-Id` yang diisi Nginx lewat `auth_request`. Port .NET hanya `127.0.0.1` |
| Skema database | Dimiliki Drizzle di `apps/nest/drizzle/`. EF Core hanya **membaca dan memetakan**. Tanpa `MigrateAsync`, tanpa migrasi EF |
| Aturan periode | Satu sumber kebenaran: ASP.NET Core. Modul Nest `periods` dibekukan |
| Target framework | `net10.0` (CI sudah memakai SDK `10.0.x`). `Directory.Build.props` dinaikkan dari `net8.0` |
| Biaya | Nol tambahan. GitHub Actions, Render free tier, Neon |
| Aturan | CI wajib hijau di setiap akhir fase. Tidak ada fase yang boleh merusak workflow yang sudah lolos |

## 2. Inventaris Baseline (`backend/asp-net-core`)

| Kelompok | Reports | Periods | ChartOfAccounts |
| --- | --- | --- | --- |
| Controller | 6 file, 1.077 | `PeriodsController` 299 | `ChartOfAccountsController` 341 |
| Service | 11 file, 1.452 | `PeriodsService` 492 + interface 43 | `ChartOfAccountsService` 273 + interface 33 |
| DTO | 5 file, 1.179 | `PeriodsDto` 285 | `ChartOfAccountsDto` 247 |
| ViewModel | 5 file, 655 | `PeriodsViewModel` 136 | `ChartOfAccountsViewModel` 9 |
| Model | 6 file, 26 (hampir kosong) | `Period` 59, `PeriodsModel` 5 | `ChartOfAccount` 76, `ChartOfAccountsModel` 241 |
| Validator | memakai `Validators/Queries` | `CreatePeriodRequestValidator` 119 | `Create/UpdateAccountRequestValidator` 60, `AccountRuleExtensions` 43 |
| **Subtotal (baris)** | **4.389** | **1.438** | **1.323** |

Total sekitar **7.150 baris**, belum termasuk `GetAccountsQueryValidator` (32), `QueryParametersDto`, dan `TransactionCounter` (34).

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
| `PeriodsController` | `/periods` | GET, POST |
| | `/periods/open-info` | GET |
| | `/periods/select/{id:int}` | POST |
| | `/periods/clear-selection` | POST |
| | `/periods/close/{id:int}` | POST |
| `ChartOfAccountsController` | `/chart-of-accounts` | GET, POST |
| | `/chart-of-accounts/{id:int}` | PUT, DELETE |

Jumlah endpoint aktif: **13 (Reports) + 6 (Periods) + 4 (ChartOfAccounts) = 23**.

### 2.2 Padanan yang sudah ada di `apps/nest`

| Area | Nest sekarang | Selisih dengan ASP.NET |
| --- | --- | --- |
| Periods | `periods.controller.ts` (`GET /`, `GET open-info`, `POST /`, `POST :id/select`, `POST clear-selection`, `POST :id/close`) + `periods.service.ts`, `opening-balance.service.ts` | Bentuk rute `select` dan `close` berbeda: Nest `:id/select`, .NET `select/{id}` |
| ChartOfAccounts | `chart-of-accounts.service.ts` saja, **tanpa controller** | Rute CRUD hanya ada di .NET |
| Reports | tidak ada | Hanya di .NET |

Dua implementasi periode hidup berdampingan selama pola duplikasi. Penanganannya ada di Fase 6 dan bagian 6.

### 2.3 Temuan yang harus ditangani saat memindahkan

| # | Temuan | Penanganan |
| --- | --- | --- |
| 1 | `TrialBalanceController` tidak punya endpoint. Isinya dua method statis stub yang selalu mengembalikan list kosong. **Di sumber, `FinancialStatements`, `Journals` (jurnal penutup), dan `FinancialReportService` memanggil stub ini**, sehingga laba rugi, laba ditahan, posisi keuangan, dan jurnal penutup di backend lama dihitung dari data kosong | Controller stub tidak disalin. Pemanggil diganti `ITrialBalanceService.BuildTrialBalanceRowsAsync(db, userId, period, true)` yang asli (disuntikkan lewat konstruktor). Hasil laporan tersebut **sengaja berbeda** dari backend lama (lihat bagian 6) |
| 2 | Ada dua service trial balance: `TrialBalanceService` (terdaftar di DI sumber, dipakai Worksheet) dan `TrialBalancesService` (tidak terdaftar dan tidak dipakai di sumber) | **Diputuskan:** `TrialBalanceService` dipertahankan. `TrialBalancesService` dan `ITrialBalancesService` tidak disalin |
| 3 | `SummaryController` memakai rute `/summary`, bukan `/reports/summary` | Dinormalisasi ke `/reports/summary`. Alias lama dipertahankan di Nginx sampai klien diperbarui |
| 4 | Nama kelas `JournalController` tidak sama dengan file `JournalsController.cs` | Samakan menjadi `JournalsController` |
| 5 | `SelectedPeriodHelper` punya overload `object` sebagai "safety fallback" | Hanya overload bertipe kuat yang disalin |
| 6 | Endpoint yang mengubah data: `POST general-ledgers/refresh`, `DELETE journals/adjusting/{id}`, `POST/PUT/DELETE chart-of-accounts`, `POST periods`, `select`, `clear-selection`, `close` | Seluruhnya wajib punya tes integrasi sebelum cutover |
| 7 | `SummaryController` memakai `UserManager<ApplicationUser>` | Diganti pembaca `X-User-Id` (Fase 4). `ApplicationUser` tidak disalin |
| 8 | `PeriodsService` memanggil `IGeneralLedgersService.RefreshGeneralLedgersAsync` dan `ITransactionNumberService` (keduanya opsional/nullable) | `IGeneralLedgersService` ikut karena bagian Reports. `ITransactionNumberService` + `TransactionCounter` disalin **hanya bila** terpakai saat pembuatan periode; modul `JournalEntries` lain tidak ikut |
| 9 | `ChartOfAccountsController` dan `ChartOfAccountsService` membaca periode terpilih lewat `SelectedPeriodHelper` | Helper ikut. Perilaku "periode terpilih per pengguna" tidak berubah |
| 10 | `ChartOfAccountsModel.cs` (241 baris) berisi `AccountClassificationExtensions`, `AccountClassificationHelper`, `PeriodLock` | Disalin utuh dan dipecah per kelas. Aturan 7 kategori akun (100–199 Aset, 200–299 Liabilitas, 300–399 Ekuitas, 400–499 Pendapatan Operasional, 500–599 Beban Operasional, 600–799 Pendapatan Lain, 800–999 Beban Lain) dikunci dengan tes |
| 11 | Tabel buku besar (`GeneralLedgerPermanentAccounts`, `GeneralLedgerTemporaryAccounts`) **tidak ada** di skema Drizzle (`apps/nest/src/db/schema/` hanya `auth`, `chart-of-accounts`, `general-journal`, `periods`, `transaction-counters`) | Tambahkan ke skema Drizzle di Fase 5, atau dokumentasikan sebagai SQL manual Neon. Satu pilihan, tertulis |
| 12 | Hanya ada satu tes di sumber (`CoreControllerTests`), tidak ada untuk akuntansi | Tes dibuat baru di Fase 7 |
| 13 | Header file memakai `PlaceholderCompany` | Dibersihkan agar lolos StyleCop (lihat bagian 3) |
| 14 | Salinan awal di repo ini dirusak skrip perbaikan otomatis: logika dikosongkan (`dynamic rows = null; // await call refactored out`), field `dynamic` palsu, dan antarmuka tertukar (`IJournalsService` di mana-mana, `IWorksheetService` menggantikan `ITrialBalanceService`) | Dipulihkan dari sumber. Skrip `dotnet/fix_code_references.py` dihapus |
| 15 | `PeriodsService` di salinan awal tidak pernah menyimpan jurnal saldo awal (`journalEntryId = 1`, tanpa `AddRange`). Sumber memakai `GeneralJournalWriter` | `GeneralJournalWriter` disalin ke `Services/Reports/Journals`. Ia memakai sekuens PostgreSQL `GeneralJournal_JournalEntryId_seq`, **wajib diverifikasi di Neon pada Fase 5** |
| 16 | Validasi tipe akun di `ChartOfAccountsService` mem-parse tipe plural (`Assets`, `Liabilities`) ke enum singular `AccountClassification` (`Asset`, `Liability`), dan `ValidateReferenceNumber(enum)` di sumber melempar `NotImplementedException`. Pembuatan akun nyaris selalu ditolak | Memakai `IsKnownAccountType` dan `ValidateReferenceNumber(type, nomor)`, serta `NormalBalanceIsDebit(string)`. Enum lama tidak lagi dipakai |
| 17 | `SummaryService`: `ActiveCoa` menghitung akun semua pengguna; `ResolveUserIdAsync` mengembalikan `null` bila `UserManager` ada | Difilter per pengguna dan `IsActive`. Id pengguna dibaca dari claim `NameIdentifier` |
| 18 | `ChartOfAccount.DisplayLabel` kehilangan pemisah ` - ` di salinan awal | Dikembalikan ke format sumber (`{no} - {nama}`) |
| 20 | Validator akun (`CreateAccountRequestValidator`, `UpdateAccountRequestValidator`, `AccountRuleExtensions`) belum tersalin walau tercentang di Fase 3, dan empat `IValidator<>` yang disuntikkan ke controller `Periods` dan `ChartOfAccounts` tidak terdaftar di DI (endpoint akan gagal 500 saat controller dibuat) | Tiga file disalin ke `Validators/ChartOfAccounts`. Keempat validator didaftarkan di `AddAccountingServices()` |
| 19 | Tidak ada `[Authorize]` pada satu pun controller di salinan awal | `[Authorize]` ditambahkan ke seluruh controller. Tes integrasi gateway menyusul di Fase 4 dan 7 |

### 2.4 Ketergantungan bersama yang ikut disalin

| Jenis | Item | Catatan |
| --- | --- | --- |
| Model EF | `Period`, `ChartOfAccount`, `GeneralJournal`, `GeneralLedgerPermanentAccount`, `GeneralLedgerTemporaryAccount`; `TransactionCounter` bila terpakai (temuan 8) | 5 sampai 6 entitas |
| DbContext | `AppDbContext` versi ramping | 5 sampai 6 `DbSet`. Tanpa Identity, Hangfire, DataProtection |
| Helper | `SelectedPeriodHelper`, `GeneralJournalWriter` | Periode terpilih ditentukan lewat `IsSelected` per pengguna. `GeneralJournalWriter` menulis jurnal saldo awal (temuan 15) |
| DTO bersama | `SummaryDto`, `QueryParametersDto` (bagian `GetAccountsQuery`) | |
| Validator | `CreatePeriodRequestValidator`, `Create/UpdateAccountRequestValidator`, `AccountRuleExtensions`, `GetAccountsQueryValidator`, `ValidationResultExtensions` | |

### 2.5 Tidak ikut disalin

`AuthController`, `Services/Auth`, `Services/Identity`, Identity/JWT/Google di `ServiceCollectionExtensions`, Hangfire, Redis cache, Cloudinary, AWS S3, ClosedXML, ExcelDataReader, FFI Rust (`../axum`), `Migrations/`, serta controller non-akuntansi (`JournalEntry`, `Dashboard`, `Tools`, `Notifications`, `Settings`, `Core`, `Home`, `Avatars`, `Health`). Controller tersebut diduplikasi ke `apps/nest`, lihat [`MIGRASI-ASPNET-NEST.md`](./MIGRASI-ASPNET-NEST.md).

> Catatan: `JournalEntry` (input jurnal) di luar ruang lingkup dokumen ini; dipetakan ke `apps/nest` di `MIGRASI-ASPNET-NEST.md`. Laporan membaca tabel `GeneralJournal` yang diisi oleh modul tersebut. Bila nanti ikut dipindahkan, dokumen ini diperluas dengan fase tambahan.

## 3. Benturan Konfigurasi (Sumber vs Repo Tujuan)

| Aspek | Sumber (`aumo-finance`) | `aumo-typescript` (sekarang) | Dampak dan penanganan |
| --- | --- | --- | --- |
| Framework | `net10.0` | `Directory.Build.props`: `net8.0` | Dinaikkan ke `net10.0` (Fase 2) |
| Paket preview | `10.0.0-preview.*` (EF, Npgsql, Identity) | Tidak ada | Pakai rilis stabil `10.0.x`. Tanpa paket preview |
| Analyzer | Roslynator, tanpa `TreatWarningsAsErrors` | StyleCop + `TreatWarningsAsErrors=true` + `GenerateDocumentationFile` | Kode sumber gagal build apa adanya. Rapikan header, XML doc, urutan `using`. **Keputusan sementara:** seluruh kategori StyleCop dibungkam di `dotnet/.editorconfig` (paket tetap terpasang, aturan CA*/IDE* tetap berlaku). Tidak memakai `NoWarn` global |
| Autentikasi | Identity cookie + JWT Bearer | Go auth + Nginx `auth_request` | Semua `[Authorize(AuthenticationSchemes = ...)]` diganti satu skema internal (Fase 4) |
| Tipe `UserId` | `Guid` | Go `auth.users.id` bertipe `uuid`. Nest memakai `text` | Parse `X-User-Id` ke `Guid`. Kolom `user_id` bertipe `text`, konversi dipetakan eksplisit |
| Penamaan tabel/kolom | PascalCase (EF) | Drizzle: `snake_case` | **Titik keputusan Fase 5.** Cocokkan dengan skema Neon yang nyata |
| Rute | Absolut (`/reports/...`, `/periods`, `/chart-of-accounts`), tanpa `/api` | Nginx memotong `/api` | Cocok. Rute .NET tetap tanpa `/api` |
| Rute `/api/periods` | Dimiliki Nest lewat `location /api/` | | Blok Nginx baru untuk .NET diletakkan **di atas** `/api/` |
| Port | `PORT` Render | Nginx `$PORT`, Go `8080`, Nest `5000` | .NET memakai `5100`, hanya loopback |
| Dokumentasi API | `MapOpenApi` + Scalar | Scalar sudah ada di Nest (`/api/reference`) | Scalar .NET di `/api/accounting/reference` (Fase 6) |
| CI | tidak ada | `polyglot-ci.yml` hanya `dotnet build` | Tambah `dotnet test` (Fase 7) |
| Memori Render | satu proses .NET | 3 proses (Nginx, Go, Nest) dalam satu container | Proses ke-4 menambah beban memori (bagian 6) |

## 4. Fase Migrasi (9 Fase)

### Fase 1 — Baseline & Keputusan

- [x] Catat commit SHA sumber (`aumo-finance`) sebagai titik acuan salinan.
- [x] Tetapkan keputusan: auth dipegang Go, .NET membaca `X-User-Id`; skema dipegang Drizzle, EF hanya membaca; aturan periode dipegang .NET.
- [x] Tetapkan pola duplikasi: tidak ada file yang dihapus di aumo-finance maupun `apps/nest`.
- [x] Catat di `docs/adr/0009-aspnet-akuntansi-masuk-monorepo.md` (status *Proposed*).
- [x] **Keluaran:** ADR 0009. **Selesai bila:** otoritas auth, pemilik skema, pemilik aturan periode, dan daftar 23 rute tertulis.

### Fase 2 — Penyelarasan Toolchain .NET (belum ada kode akuntansi)

- [x] `Directory.Build.props`: `TargetFramework` → `net10.0`.
- [x] `.editorconfig` di `dotnet/`: matikan aturan StyleCop yang bertabrakan dengan gaya sumber (header file, urutan `using`), satu per satu dengan alasan tertulis.
- [x] Buat `Aumo.Accounting.Api` (kosong, `Microsoft.NET.Sdk.Web`) dan `Aumo.Accounting.Tests` (xUnit), tambahkan ke `dotnet/App.sln`.
- [x] `polyglot-ci.yml`: build `dotnet/App.sln` tetap hijau.
- [x] **Keluaran:** solusi kosong terbangun di CI. **Selesai bila:** `dotnet build` dengan `TreatWarningsAsErrors=true` lolos.

### Fase 3 — Salin dan Rapikan Kode

Urutan salin mengikuti arah ketergantungan: model → helper → validator → service → DTO/ViewModel → controller.

- [x] **Model dan DbContext:** `Period`, `ChartOfAccount` (+ klasifikasi akun, dipecah dari `ChartOfAccountsModel.cs`), `GeneralJournal`, `GeneralLedgerPermanentAccount`, `GeneralLedgerTemporaryAccount`, `TransactionCounter` bila terpakai; `AppDbContext` ramping.
- [x] **Helper:** `SelectedPeriodHelper` (overload bertipe kuat saja).
- [x] **Validator:** `CreatePeriodRequestValidator`, validator akun, `GetAccountsQueryValidator`, `ValidationResultExtensions`.
- [x] **Service:** `Services/Reports`, `PeriodsService`, `ChartOfAccountsService`, beserta interface.
- [x] **DTO dan ViewModel:** Reports, Periods, ChartOfAccounts, `SummaryDto`, `QueryParametersDto`.
- [x] **Controller:** 6 controller Reports, `PeriodsController`, `ChartOfAccountsController`.
- [x] Ganti namespace `AumoBackend.*` → `Aumo.Accounting.Api.*`.
- [x] Terapkan temuan 1–5, 8–10, dan 13 (bagian 2.3).
- [x] Daftarkan service di satu `AddAccountingServices()` (pengganti `AddApplicationServices`).
- [x] **Keluaran:** `Aumo.Accounting.Api` terbangun. **Selesai bila:** `dotnet build` lolos tanpa kode `Identity`, `Hangfire`, `Redis`, atau `Rust`.

> Verifikasi Fase 3 (CI, `dotnet build dotnet/App.sln -c Release /p:TreatWarningsAsErrors=true`): **0 warning, 0 error**. Pencarian `Identity`, `UserManager`, `Hangfire`, `Redis`, `Rust`, dan token JWT pada `Aumo.Accounting.Api` tidak menemukan apa pun. `dotnet test`: 19 dari 22 tes lolos. Tiga tes `GatewayHeaderAuthTests` gagal karena `AppDbContext` belum didaftarkan di DI. Itu pekerjaan Fase 5, bukan cacat Fase 3.

### Fase 4 — Autentikasi via Gateway

- [x] Satu skema autentikasi internal (`GatewayHeader`) yang membaca `X-User-Id`, mengubahnya ke `Guid`, lalu membentuk `ClaimTypes.NameIdentifier`.
- [x] Tanpa header atau header tidak valid → `401` dengan bentuk `{"success":false,"message":"Unauthorized"}` (sama dengan `@unauthorized` di Nginx).
- [x] Ganti semua `[Authorize(AuthenticationSchemes = "Identity.Application,Bearer")]` dengan `[Authorize]`.
- [x] Hapus `UserManager` dari `SummaryController`.
- [x] Kestrel hanya mendengarkan `127.0.0.1:5100`. Nginx selalu menimpa `X-User-Id`, sehingga header dari luar tidak pernah sampai.
- [x] **Keluaran:** 23 endpoint terlindungi. **Selesai bila:** tes menunjukkan tanpa header = 401, header sah = 200.

> Verifikasi Fase 4 (CI): `dotnet build` 0 warning, 0 error; `dotnet test` **25 dari 25 lolos**. `AuthorizationCoverageTests` memastikan setiap controller memakai `[Authorize]`, tidak ada `[AllowAnonymous]`, dan jumlah endpoint tepat 23. `GatewayHeaderAuthTests` memakai `AccountingApiFactory` (database in-memory): tanpa header dan header tidak valid → 401 `{"success":false,"message":"Unauthorized"}`; header sah → 200. Tes kueri nyata memakai PostgreSQL pada Fase 7.

### Fase 5 — Data Layer dan Skema

- [ ] Ambil skema nyata dari Neon (`information_schema.columns`) untuk semua tabel akuntansi. Hasilnya menjadi acuan.
- [ ] Petakan nama tabel dan kolom di `OnModelCreating` agar cocok dengan skema nyata. Satu konvensi, tidak dicampur.
- [ ] Petakan `UserId` `Guid` ↔ kolom `text` (value converter).
- [ ] Putuskan tempat tabel buku besar (temuan 11): ditambahkan ke skema Drizzle, atau SQL manual Neon yang didokumentasikan.
- [ ] Tanpa `Database.MigrateAsync()` dan tanpa folder `Migrations/`. Perubahan skema lewat Drizzle dan dijalankan manual, bukan dari CI.
- [ ] Koneksi memakai `DATABASE_URL` yang sama dengan Nest. Konversi URL → connection string Npgsql dilakukan di satu tempat.
- [ ] **Keluaran:** catatan pemetaan skema di `docs/`. **Selesai bila:** query baca tiap tabel berhasil di Neon pengembangan.

### Fase 6 — Rute dan Kontrak

- [ ] Rute final (23 endpoint) mengikuti bagian 2.1, dengan `Summary` dinormalisasi ke `/reports/summary`.
- [ ] Alias kompatibilitas kontrak Nest pada Periods: `POST /periods/{id:int}/select` dan `POST /periods/{id:int}/close`, sehingga klien yang memakai bentuk Nest tetap berjalan. Rute asli `select/{id}` dan `close/{id}` tetap.
- [ ] Endpoint publik `/health`, OpenAPI, dan Scalar (diteruskan Nginx sebagai `/api/accounting/health`, `/api/accounting/reference`, `/api/accounting/openapi.json`).
- [ ] Kontrak respons Reports, Periods, dan ChartOfAccounts ditambahkan ke `libs/contracts` (Zod) dan disalin ke DTO C# (kewajiban ADR 0004).
- [ ] Tidak ada perubahan bentuk respons dari sumber, kecuali yang tercatat di dokumen ini.
- [ ] **Keluaran:** daftar rute dan kontrak final di `docs/`. **Selesai bila:** Scalar menampilkan 23 rute dan kontrak Zod lolos `pnpm typecheck`.

### Fase 7 — Tes dan Gerbang CI

- [ ] Tes unit untuk `Services/Reports` (trial balance, worksheet, laba rugi, posisi keuangan, arus kas).
- [ ] Tes unit untuk `PeriodsService` (buat periode, saldo awal, pilih, kosongkan pilihan, tutup) dan `PeriodLock`.
- [ ] Tes unit untuk klasifikasi akun (7 rentang nomor) dan validator akun.
- [ ] Tes integrasi controller dengan PostgreSQL nyata (Testcontainers) untuk 23 endpoint, termasuk semua endpoint pengubah data (temuan 6).
- [ ] Tes aturan akuntansi: periode ditentukan oleh `EntryDate` dalam rentang `StartDate`–`EndDate`; jurnal penutup dihitung langsung dari trial balance dan tidak disimpan.
- [ ] `polyglot-ci.yml`: tambah `dotnet test dotnet/App.sln`.
- [ ] **Keluaran:** CI memvalidasi akuntansi. **Selesai bila:** build dan tes .NET hijau di GitHub Actions.

### Fase 8 — Gateway, Docker, dan Render

- [ ] `nginx.conf`: tambah satu blok untuk `^~ /api/reports/`, `^~ /api/periods`, dan `^~ /api/chart-of-accounts` **sebelum** `/api/`. Isinya `auth_request /_validate`, `X-User-Id`, `rewrite ^/api/(.*) /$1 break;`, `proxy_pass http://127.0.0.1:5100;`, preflight `OPTIONS` ditangani seperti blok Nest.
- [ ] Rute publik: `/api/accounting/health`, `/api/accounting/reference`, `/api/accounting/openapi.json` tanpa `auth_request` (di-rewrite ke `/health`, `/reference`, `/openapi/v1.json` di .NET).
- [ ] Alias sementara `/api/summary` → `/reports/summary`.
- [ ] `Dockerfile`: tahap baru `builder-dotnet` (`mcr.microsoft.com/dotnet/sdk:10.0-alpine`, `dotnet publish -c Release -r linux-musl-x64 --self-contained -p:PublishTrimmed=true -p:InvariantGlobalization=true`). Salin hasilnya ke image akhir, tambahkan `apk add libstdc++ libgcc`.
- [ ] `supervisord.conf`: tambah `[program:dotnet-accounting]` dengan `ASPNETCORE_URLS=http://127.0.0.1:5100`.
- [ ] `render.yaml`: tambah `dotnet/**` ke `buildFilter`. Env `DATABASE_URL` yang sama dipakai bersama.
- [ ] **Keluaran:** satu image berisi Nginx, Go, Nest, dan .NET. **Selesai bila:** `/api/accounting/health` membalas 200 di Render.

### Fase 9 — Cutover (tanpa penghapusan)

- [ ] Uji asap berurutan: login (Go) → buat dan pilih periode → kelola akun → seluruh endpoint laporan.
- [ ] Bandingkan angka laporan dengan backend aumo-finance pada data yang sama.
- [ ] Frontend (`apps/analog`) diarahkan ke `/api/reports/*`, `/api/periods/*`, `/api/chart-of-accounts/*`.
- [ ] Tandai modul Nest `periods` dan `chart-of-accounts` sebagai *tidak dirutekan* (komentar di modul dan satu baris di dokumen ini). Kode tidak dihapus.
- [ ] Perbarui ADR 0009 menjadi *Accepted*, tambah changeset.
- [ ] **Tidak ada** penghapusan di aumo-finance maupun `apps/nest`.
- [ ] **Keluaran:** satu jalur rute akuntansi di .NET. **Selesai bila:** angka laporan identik dan seluruh rute akuntansi dilayani .NET.

## 5. Alur Gateway Setelah Migrasi

```
Browser ──► Nginx ($PORT)
              ├─ /api/auth/*                                   → Go auth (127.0.0.1:8080)
              ├─ /api/accounting/{health,reference,openapi.json} → .NET (127.0.0.1:5100, publik)
              ├─ /api/reports/*            ┐
              ├─ /api/periods/*            ├─ auth_request → Go /auth/validate
              ├─ /api/chart-of-accounts/*  ┘                → .NET (127.0.0.1:5100, prefix /api dipotong)
              ├─ /api/{health,reference,openapi.json}          → Nest (publik)
              └─ /api/*                    → auth_request → Go /auth/validate → Nest (127.0.0.1:5000)
```

Urutan blok `location` penting: blok akuntansi harus berada di atas `/api/`, agar tidak diambil blok Nest.

## 6. Risiko

| Risiko | Dampak | Penanganan |
| --- | --- | --- |
| Memori container Render free tier (512 MB) dengan 4 proses | Proses di-kill (OOM) | Publish trimmed, `DOTNET_GCHeapHardLimit`, ukur sebelum cutover. Bila tidak cukup, pisahkan menjadi service Render tersendiri |
| Nama tabel/kolom EF tidak cocok dengan skema Drizzle | Query gagal atau salah kolom | Fase 5 mengacu pada skema nyata, bukan kode sumber |
| Angka laporan berbeda dari backend lama | Kesalahan akuntansi | Perbandingan angka pada data identik di Fase 9. **Pengecualian yang diketahui:** laba rugi, laba ditahan, posisi keuangan, dan jurnal penutup di backend lama dihitung dari stub kosong (temuan 1). Selisih pada empat laporan itu dinilai dari perhitungan `TrialBalanceService`, bukan dari keluaran backend lama |
| **Dua implementasi periode** (Nest dan .NET) menulis ke tabel yang sama | Aturan periode tidak sinkron, data ganda atau saling menimpa | Nginx tidak lagi merutekan `/api/periods` ke Nest. Modul Nest dibekukan. Tidak ada klien yang boleh memanggil Nest untuk periode |
| Perbedaan bentuk rute `select`/`close` (Nest vs .NET) | Klien lama gagal (404) | Alias di Fase 6 |
| Tabel buku besar tidak ada di Drizzle | Skema tidak punya satu pemilik | Keputusan tertulis di Fase 5 |
| `TreatWarningsAsErrors` menolak kode sumber | CI merah di Fase 3 | Rapikan bertahap per kelompok, bukan mematikan analyzer secara global |
| `JournalEntry` tetap di backend lama, sedangkan laporan dan periode pindah | Data jurnal masuk lewat jalur lain | Cakupan dicatat di bagian 2.5. Jurnal tetap menulis ke tabel `GeneralJournal` yang sama |

## 7. Variabel Lingkungan (.NET)

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ya | Sama dengan Nest. Dikonversi ke connection string Npgsql |
| `ASPNETCORE_URLS` | ya | `http://127.0.0.1:5100` |
| `ASPNETCORE_ENVIRONMENT` | tidak | `Production` di Render |

Tidak ada secret baru. `JWT_SECRET` dan sejenisnya tidak dipakai .NET.
