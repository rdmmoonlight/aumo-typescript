# 0009. Sistem akuntansi ASP.NET Core masuk monorepo

(status *Proposed*.)

## Konteks

Backend akuntansi di `aumo-finance/backend/asp-net-core` memiliki controller `Reports`
(laporan keuangan, buku besar, jurnal, neraca saldo, worksheet, ringkasan), `Periods`, dan `ChartOfAccounts`.
Ketiganya perlu menjadi bagian monorepo `aumo-typescript` dan ditangani oleh ASP.NET Core.
Peta fase: [`docs/MIGRASI-ASPNET-ACCOUNTING.md`](../MIGRASI-ASPNET-ACCOUNTING.md).

## Keputusan

- Controller `Reports`, `Periods`, dan `ChartOfAccounts` beserta kelengkapannya disalin ke `dotnet/src/Aumo.Accounting.Api`.
- ASP.NET Core menjadi satu-satunya penangan rute `/api/reports/*`, `/api/periods/*`, dan `/api/chart-of-accounts/*`.
- Pola duplikasi: tidak ada kode yang dihapus di aumo-finance maupun `apps/nest`. Modul Nest `periods` dan `chart-of-accounts` dibekukan dan tidak dirutekan.
- Auth tetap milik `services/auth` (Go), sesuai ADR 0006 dan 0007. .NET membaca `X-User-Id` dari Nginx dan tidak memakai Identity, cookie, atau JWT sendiri.
- Skema database tetap milik Drizzle (`apps/nest/drizzle/`). EF Core hanya membaca dan memetakan, tanpa migrasi EF.
- Target `net10.0`. Tanpa paket preview.
- Kontrak respons masuk `libs/contracts` (ADR 0004).

## Akibat

- Satu container menjalankan empat proses (Nginx, Go, Nest, .NET). Memori Render free tier diukur sebelum cutover.
- `Directory.Build.props` naik dari `net8.0` ke `net10.0`.
- Aturan periode hanya hidup di ASP.NET Core. Nest tidak lagi menerima rute periode.
