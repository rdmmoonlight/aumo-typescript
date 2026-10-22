# Peta Dokumentasi (Arsip Terpusat)

> Dibuat: 2026-10-23 · Diperbarui: 2026-10-23

Satu pintu untuk menemukan seluruh dokumentasi repo. Status: **Aktif** = berlaku, **Peta** = rencana pemetaan (belum memindahkan kode), **Panduan** = petunjuk kerja, **Arsip** = tidak berlaku lagi.

## Dokumen di `docs/`

| Dokumen | Status | Dibuat | Diperbarui | Isi |
| --- | --- | --- | --- | --- |
| [`ALUR-BACKEND.md`](../ALUR-BACKEND.md) | Panduan | 2026-10-19 | 2026-10-19 | Alur kerja backend: kontrak Zod → implementasi → logger → tes/CI |
| [`CI-PIPELINE.md`](../CI-PIPELINE.md) | Panduan | 2026-10-19 | 2026-10-19 | Mekanisme CI, autofix, dan auto-commit |
| [`DEPLOY-RENDER.md`](../DEPLOY-RENDER.md) | Aktif | 2026-10-19 | 2026-10-20 | Deploy satu service Docker ke Render, proses, port, alur auth |
| [`MIGRASI-ANALOG.md`](../MIGRASI-ANALOG.md) | Arsip | 2026-10-19 | 2026-10-22 | Peta migrasi aumo-finance/analog → apps/analog. Digantikan apps/next (ADR 0011) |
| [`MIGRASI-ASPNET-ACCOUNTING.md`](../MIGRASI-ASPNET-ACCOUNTING.md) | Peta | 2026-10-20 | 2026-10-22 | Peta duplikasi akuntansi ASP.NET Core (Reports, Periods, ChartOfAccounts) → dotnet/ |
| [`MIGRASI-ASPNET-NEST.md`](../MIGRASI-ASPNET-NEST.md) | Peta | 2026-10-20 | 2026-10-22 | Peta duplikasi sisa /backend aumo-finance → apps/nest |
| [`MIGRASI-NEST.md`](../MIGRASI-NEST.md) | Peta | 2026-10-18 | 2026-10-19 | Peta migrasi aumo-finance/nest → apps/nest |
| [`PETA-RUTE-NEXT.md`](../PETA-RUTE-NEXT.md) | Aktif | 2026-10-22 | 2026-10-22 | Peta rute API dan gerbang untuk apps/next |
| [`SCHEMA-MAPPING.md`](../SCHEMA-MAPPING.md) | Aktif | 2026-10-22 | 2026-10-22 | Pemetaan skema Neon DB ke EF Core (tabel, tipe user_id, entitas) |
| [`SCRIPTS.md`](../SCRIPTS.md) | Panduan | 2026-10-20 | 2026-10-20 | Cara menjalankan skrip apps/analog (typecheck, lint, dst.) |

## ADR (`docs/adr/`)

| ADR | Dibuat | Diperbarui | Judul |
| --- | --- | --- | --- |
| [`0001-record-architecture-decisions.md`](../adr/0001-record-architecture-decisions.md) | 2026-10-18 | 2026-10-18 | Catat keputusan arsitektur |
| [`0002-use-pnpm-and-nx-monorepo.md`](../adr/0002-use-pnpm-and-nx-monorepo.md) | 2026-10-18 | 2026-10-18 | pnpm workspace dan Nx |
| [`0003-use-zod-contracts-and-pino-logging.md`](../adr/0003-use-zod-contracts-and-pino-logging.md) | 2026-10-19 | 2026-10-19 | Zod untuk kontrak, Pino untuk log |
| [`0004-polyglot-architecture-and-contract-validation.md`](../adr/0004-polyglot-architecture-and-contract-validation.md) | 2026-10-19 | 2026-10-19 | Arsitektur polyglot dan validasi kontrak |
| [`0005-automated-releases-and-dependency-governance.md`](../adr/0005-automated-releases-and-dependency-governance.md) | 2026-10-19 | 2026-10-19 | Rilis otomatis dan tata kelola dependensi |
| [`0006-go-auth-service-cookie-and-jwt.md`](../adr/0006-go-auth-service-cookie-and-jwt.md) | 2026-10-18 | 2026-10-18 | Layanan auth Go (cookie web, JWT mobile) |
| [`0007-nest-masuk-monorepo.md`](../adr/0007-nest-masuk-monorepo.md) | 2026-10-19 | 2026-10-19 | NestJS masuk monorepo |
| [`0008-analog-frontend-masuk-monorepo.md`](../adr/0008-analog-frontend-masuk-monorepo.md) | 2026-10-20 | 2026-10-20 | Frontend Analog masuk monorepo (digantikan 0011) |
| [`0009-aspnet-akuntansi-masuk-monorepo.md`](../adr/0009-aspnet-akuntansi-masuk-monorepo.md) | 2026-10-20 | 2026-10-21 | Akuntansi ASP.NET Core masuk monorepo (Proposed) |
| [`0010-duplikasi-backend-ke-nest.md`](../adr/0010-duplikasi-backend-ke-nest.md) | 2026-10-20 | 2026-10-22 | Duplikasi sisa backend ke apps/nest (Proposed) |
| [`0011-next-menggantikan-analog-api-ditangani-nest.md`](../adr/0011-next-menggantikan-analog-api-ditangani-nest.md) | 2026-10-22 | 2026-10-22 | apps/next menggantikan analog, apps/api dihapus (Proposed) |

## Dokumen di luar `docs/`

| Dokumen | Dibuat | Diperbarui | Isi |
| --- | --- | --- | --- |
| [`README.md`](../../README.md) | 2026-10-18 | 2026-10-18 | README singkat |
| [`CONTRIBUTING.md`](../../CONTRIBUTING.md) | 2026-10-19 | 2026-10-19 | Panduan kontribusi |
| [`MAINTAINERS.md`](../../MAINTAINERS.md) | 2026-10-19 | 2026-10-19 | Panduan maintainer |

Changelog paket: `apps/api/CHANGELOG.md`, `apps/analog/CHANGELOG.md`, `libs/contracts/CHANGELOG.md`, `libs/sdk/CHANGELOG.md`.

Catatan: dokumentasi milik folder terkunci (misalnya `apps/nest/docs/`) tidak diindeks di sini.
