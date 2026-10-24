# Peta Aplikasi

> Dibuat: 2026-10-23 · Diperbarui: 2026-10-23 · Basis commit: `2be4ad7`

## Denah Komponen

```
Browser / Android
      │
      ▼
 Nginx ($PORT, gerbang tunggal)          nginx.conf
      ├── /auth/, /api/auth/, /api/avatars/, /api/settings/ ──► Go auth      :8080   services/auth
      ├── /api/reports/, /api/periods, /api/chart-of-accounts,
      │   /api/summary, /api/accounting/*                  ──► .NET         :5100   dotnet/          (terkunci)
      ├── /health, /api/tools/, rute API lain               ──► NestJS       :5000   apps/nest/       (terkunci)
      └── /  (halaman web statis)                           ──► Next.js export       apps/next/       (terkunci)
```

Seluruh proses dijalankan `supervisord.conf` dalam satu kontainer (program: nginx, go-auth, nest-api, dotnet-accounting). Daftar rute lengkap ada di `nginx.conf`; tabel di atas adalah rute utama.

## Komponen

| Komponen | Lokasi | Bahasa | Peran | Status |
| --- | --- | --- | --- | --- |
| Auth | `services/auth` | Go 1.22 | Register, login, Google OAuth, JWT; cookie untuk web, Bearer JWT untuk mobile (ADR 0006) | Aktif |
| API Node | `apps/nest` | TypeScript (NestJS 11) | Rute API dan dokumentasi Scalar | Terkunci |
| Akuntansi | `dotnet/` | C# (.NET 10) | Reports, Periods, ChartOfAccounts | Terkunci |
| Web baru | `apps/next` | TypeScript (Next.js) | Frontend pengganti Analog (ADR 0011) | Terkunci |
| Web lama | `apps/analog` | TypeScript (Angular 19 + Analog) | SPA statis, digantikan Next | Arsip |
| API tiruan | `apps/api` | TypeScript | Hanya tes tiruan, rencana dihapus | Usang |
| Kontrak | `libs/contracts` | TypeScript (Zod) | Sumber tunggal skema data | Aktif |
| Logger | `libs/logger` | TypeScript (Pino) | Log terstruktur | Aktif |
| Android | `android/` | Kotlin | Klien mobile, kontrak User | Aktif |
| Native | `native/` | Rust, C++ | `workers`, `cpp_calc` | Aktif |
| CLI | `tools/cli` | JavaScript | Alat internal | Aktif |
| Generator | `plopfile.mjs`, `templates/lib` | JS/Handlebars | Scaffolding pustaka baru | Aktif |

## Alur Data Utama

1. **Kontrak**: skema Zod di `libs/contracts` menjadi acuan tipe untuk server, SDK, dan klien.
2. **Autentikasi**: klien memanggil Go auth. Web menerima cookie HttpOnly/Secure/SameSite, mobile menerima JWT.
3. **Validasi rute**: Nginx memanggil `/_validate` (Go) sebelum meneruskan rute terlindungi.
4. **Data**: layanan membaca/menulis PostgreSQL (Neon); Nest memakai Redis/BullMQ untuk antrean.

## CI/CD

| Workflow | Berkas | Fungsi |
| --- | --- | --- |
| CI Pipeline | `.github/workflows/ci.yml` | lint, typecheck, test, build, autofix + auto-commit |
| Polyglot CI | `.github/workflows/polyglot-ci.yml` | Go, Rust, .NET, Android, Postgres 16 |
| Check Lockfile | `.github/workflows/dependency-rules.yml` | konsistensi `pnpm-lock.yaml` pada PR |
| Release Automation | `.github/workflows/release.yml` | PR "Version Packages" lewat Changesets |

Detail: `docs/CI-PIPELINE.md`, `docs/DEPLOY-RENDER.md`.

## Rujukan Silang

- Identitas: `IDENTITAS-REPO.md`
- Semua berkas + tanggal: `PETA-FILE.md`
- Semua dokumentasi: `PETA-DOKUMENTASI.md`
