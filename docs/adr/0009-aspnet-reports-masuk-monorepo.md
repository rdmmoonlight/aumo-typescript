# 0009. Controller `/reports` ASP.NET Core masuk monorepo

(status *Proposed*.)

## Konteks

Backend akuntansi di `aumo-finance/backend/asp-net-core` memiliki controller `Reports`
(laporan keuangan, buku besar, jurnal, neraca saldo, worksheet, ringkasan).
Controller ini perlu menjadi bagian monorepo `aumo-typescript` dan ditangani oleh ASP.NET Core.
Peta fase: [`docs/MIGRASI-ASPNET-REPORTS.md`](../MIGRASI-ASPNET-REPORTS.md).

## Keputusan

- Hanya controller `Reports` dan kelengkapannya yang dipindahkan ke `dotnet/src/Aumo.Reports.Api`.
- ASP.NET Core menjadi satu-satunya penangan rute `/api/reports/*`.
- Auth tetap milik `services/auth` (Go), sesuai ADR 0006 dan 0007. .NET membaca `X-User-Id` dari Nginx dan tidak memakai Identity, cookie, atau JWT sendiri.
- Skema database tetap milik Drizzle (`apps/nest/drizzle/`). EF Core hanya membaca dan memetakan, tanpa migrasi EF.
- Target `net10.0`. Tidak memakai paket preview.
- Kontrak respons masuk `libs/contracts` (ADR 0004).

## Akibat

- Satu container menjalankan empat proses (Nginx, Go, Nest, .NET). Memori Render free tier diukur sebelum cutover.
- `Directory.Build.props` naik dari `net8.0` ke `net10.0`.
- Controller `Reports` di aumo-finance dihapus hanya setelah persetujuan tertulis.
