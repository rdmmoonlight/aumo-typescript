# 0009. Sistem akuntansi ASP.NET Core masuk monorepo

(status *Proposed*. Menjadi *Accepted* setelah Fase 9 di `docs/MIGRASI-ASPNET-ACCOUNTING.md` selesai.)

## Konteks

Backend akuntansi berada di `aumo-finance/backend/asp-net-core` (ASP.NET Core, EF Core, PostgreSQL).
Bagian yang dipindahkan:

| Area | Controller | Endpoint | Baris |
| --- | --- | --- | --- |
| Reports | `FinancialStatements`, `GeneralLedgers`, `Journals`, `Summary`, `TrialBalance`, `Worksheet` | 13 | 4.389 |
| Periods | `Periods` | 6 | 1.438 |
| ChartOfAccounts | `ChartOfAccounts` | 4 | 1.323 |
| **Total** | **8** | **23** | **≈7.150** |

Monorepo ini sudah punya jalur auth (Go, ADR 0006), Nest (ADR 0007), dan frontend Analog (ADR 0008).
Nest sudah memiliki modul `periods` dan `chart-of-accounts` sendiri, tetapi tidak memiliki laporan.
Aturan akuntansi (periode, klasifikasi akun, jurnal penutup, buku besar) saat ini tersebar pada dua implementasi.

Peta fase lengkap: [`docs/MIGRASI-ASPNET-ACCOUNTING.md`](../MIGRASI-ASPNET-ACCOUNTING.md).

## Keputusan

1. **Satu penangan.** ASP.NET Core menjadi satu-satunya penangan rute akuntansi: `/api/reports/*`, `/api/periods/*`, `/api/chart-of-accounts/*`.
2. **Lokasi.** Kode disalin ke `dotnet/Aumo.Accounting.Api` dan `dotnet/Aumo.Accounting.Tests`, masuk `dotnet/App.sln`.
3. **Duplikasi, bukan pemindahan.** Tidak ada kode yang dihapus di `aumo-finance` maupun `apps/nest`. Modul Nest `periods` dan `chart-of-accounts` dibekukan dan tidak dirutekan Nginx.
4. **Auth tetap Go.** `services/auth` tetap otoritas tunggal. .NET tidak memakai Identity, cookie, atau JWT sendiri. Identitas dibaca dari header `X-User-Id` yang diisi Nginx lewat `auth_request`. Kestrel hanya mendengarkan `127.0.0.1:5100`.
5. **Skema tetap Drizzle.** Skema dimiliki `apps/nest/drizzle/`. EF Core hanya membaca dan memetakan. Tanpa `MigrateAsync`, tanpa folder `Migrations/`. Perubahan skema dijalankan manual ke Neon, bukan dari CI.
6. **Aturan periode satu sumber.** Seluruh aturan periode dan klasifikasi akun hidup di ASP.NET Core.
7. **Framework.** `net10.0`, tanpa paket preview. `Directory.Build.props` naik dari `net8.0`.
8. **Kontrak.** Bentuk respons Reports, Periods, dan ChartOfAccounts masuk `libs/contracts` (Zod) dan diselaraskan dengan DTO C# (kewajiban ADR 0004).
9. **Cakupan.** `JournalEntry` (input jurnal) di luar keputusan ini.

```
Browser ──► Nginx ($PORT)
              ├─ /api/auth/*                          → Go auth (127.0.0.1:8080)
              ├─ /api/accounting/{health,reference,openapi.json} → .NET (publik)
              ├─ /api/reports/*            ┐
              ├─ /api/periods/*            ├─ auth_request → Go /auth/validate
              ├─ /api/chart-of-accounts/*  ┘                → .NET (127.0.0.1:5100)
              ├─ /api/{health,reference,openapi.json}   → Nest (publik)
              └─ /api/*                    → auth_request → Nest (127.0.0.1:5000)
```

Blok akuntansi wajib berada di atas `location /api/` pada `nginx.conf`. Prefix `/api` dipotong sebelum diteruskan.

## Alternatif yang Ditolak

| Alternatif | Alasan ditolak |
| --- | --- |
| Menulis ulang laporan, periode, dan akun di Nest (TypeScript) | Aturan akuntansi sudah teruji di C#. Menulis ulang menambah risiko selisih angka laporan |
| Mempertahankan Identity dan JWT di .NET | Dua otoritas auth. Bertentangan dengan ADR 0006 dan 0007 |
| Membiarkan Nest dan .NET sama-sama menangani periode | Dua implementasi menulis ke tabel yang sama, aturan bisa tidak sinkron |
| Memindahkan skema ke EF Migrations | Dua pemilik skema. Drizzle sudah menjadi pemilik tabel `periods`, `chart-of-accounts`, `general-journal`, `transaction-counters` |
| Service Render terpisah untuk .NET | Biaya tambahan. Ditunda sampai pengukuran memori membuktikan satu container tidak cukup |

## Akibat

**Positif**
- Seluruh logika akuntansi berada di satu bahasa dan satu layanan.
- Auth tunggal. Tidak ada secret baru untuk .NET.
- Tanpa biaya tambahan (GitHub Actions, Render free tier, Neon).

**Negatif dan risiko**
- Satu container menjalankan empat proses (Nginx, Go, Nest, .NET). Batas memori Render free tier (512 MB) diukur sebelum cutover. Bila tidak cukup, .NET dipisah menjadi service sendiri.
- `TreatWarningsAsErrors` dan StyleCop menolak kode sumber apa adanya. Perapian dilakukan bertahap di Fase 3.
- Penamaan tabel dan kolom EF (PascalCase) belum tentu sama dengan Drizzle (`snake_case`). Pemetaan mengacu pada skema Neon yang nyata (Fase 5).
- Tabel buku besar permanen dan temporer belum ada di skema Drizzle. Keputusan tempatnya diambil di Fase 5.
- Rute `select` dan `close` pada Periods berbeda antara Nest dan .NET. Alias ditambahkan di Fase 6.
- Dua implementasi periode tetap ada di kode selama pola duplikasi. Mitigasi: Nginx tidak merutekan `/api/periods` ke Nest.

## Syarat Diterima (*Accepted*)

- [ ] 23 endpoint lolos tes integrasi dengan PostgreSQL nyata di CI.
- [ ] Angka laporan sama dengan backend `aumo-finance` pada data yang sama.
- [ ] `/api/accounting/health` membalas 200 di Render.
- [ ] Tidak ada paket preview dan tidak ada `Identity`, `Hangfire`, `Redis`, atau FFI Rust di `Aumo.Accounting.Api`.
- [ ] Changeset ditambahkan.

## Rujukan

- ADR 0004 (kontrak lintas bahasa), 0006 (Go auth), 0007 (Nest), 0008 (Analog).
- `docs/MIGRASI-ASPNET-ACCOUNTING.md` (inventaris, rute, 9 fase, risiko).
