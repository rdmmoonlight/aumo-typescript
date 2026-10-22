# Peta File Repo

> Dibuat: 2026-10-23 · Diperbarui: 2026-10-23 · Basis commit: `2be4ad7`

Kolom **Dibuat** = tanggal commit pertama yang menambahkan berkas. **Diperbarui** = tanggal commit terakhir yang menyentuh berkas. Sumber: riwayat Git. Cara menyegarkan: lihat `README.md` di folder ini.

Cakupan: 154 berkas terlacak, tidak termasuk `pnpm-lock.yaml` (dihasilkan otomatis) dan tiga folder terkunci di bagian akhir.

## (root)

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `.dockerignore` | 2026-10-19 | 2026-10-22 | Daftar yang dikecualikan dari konteks build Docker |
| `.editorconfig` | 2026-10-18 | 2026-10-18 | Aturan gaya editor (indentasi, akhir baris) |
| `.gitignore` | 2026-10-18 | 2026-10-22 | Daftar berkas yang tidak dilacak Git |
| `.prettierrc` | 2026-10-19 | 2026-10-19 | Konfigurasi Prettier |
| `CONTRIBUTING.md` | 2026-10-19 | 2026-10-19 | Panduan kontribusi, konvensi branch dan commit |
| `Cargo.lock` | 2026-10-18 | 2026-10-18 | Kunci dependensi Rust |
| `Cargo.toml` | 2026-10-19 | 2026-10-19 | Cargo workspace (native/) |
| `Directory.Build.props` | 2026-10-19 | 2026-10-21 | Properti build .NET bersama (analyzer, warning sebagai error) |
| `Dockerfile` | 2026-10-19 | 2026-10-22 | Build multi-stage: Go auth, NestJS, Next.js, .NET, image akhir Nginx+supervisord |
| `MAINTAINERS.md` | 2026-10-19 | 2026-10-19 | Panduan maintainer: release, dependensi, ADR |
| `README.md` | 2026-10-18 | 2026-10-18 | README singkat repo |
| `docker-compose.yml` | 2026-10-19 | 2026-10-20 | Menjalankan image Render secara lokal (port 10000) |
| `entrypoint.sh` | 2026-10-19 | 2026-10-19 | Skrip masuk kontainer |
| `eslint.config.mjs` | 2026-10-18 | 2026-10-20 | ESLint root (flat config) |
| `nest_proxy.conf` | 2026-10-19 | 2026-10-20 | Potongan proxy Nginx ke NestJS |
| `nginx.conf` | 2026-10-19 | 2026-10-22 | Gerbang tunggal: pemetaan rute ke Go, Nest, .NET, web statis |
| `nx.json` | 2026-10-18 | 2026-10-20 | Konfigurasi Nx (target default, cache) |
| `package.json` | 2026-10-18 | 2026-10-22 | Paket root `auts`, skrip workspace, engines |
| `plopfile.mjs` | 2026-10-19 | 2026-10-19 | Generator Plop untuk pustaka baru |
| `pnpm-workspace.yaml` | 2026-10-18 | 2026-10-22 | Workspace pnpm (apps/*, libs/*) dan izin build |
| `render.yaml` | 2026-10-19 | 2026-10-22 | Blueprint Render: service `aumo-api`, env var, filter build |
| `renovate.json` | 2026-10-19 | 2026-10-19 | Konfigurasi Renovate (pembaruan dependensi) |
| `supervisord.conf` | 2026-10-19 | 2026-10-21 | Supervisor: nginx, go-auth, nest-api, dotnet-accounting |
| `tsconfig.json` | 2026-10-18 | 2026-10-20 | TypeScript config root |
| `vitest.config.ts` | 2026-10-18 | 2026-10-20 | Konfigurasi Vitest root |

## .changeset

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `.changeset/config.json` | 2026-10-19 | 2026-10-19 | Konfigurasi Changesets (versi dan changelog otomatis) |

## .github/workflows

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `.github/workflows/ci.yml` | 2026-10-18 | 2026-10-19 | CI utama: lint, typecheck, test, build, autofix dan auto-commit |
| `.github/workflows/dependency-rules.yml` | 2026-10-18 | 2026-10-19 | Pemeriksaan konsistensi lockfile pada PR |
| `.github/workflows/polyglot-ci.yml` | 2026-10-19 | 2026-10-20 | CI lintas bahasa (Go, Rust, .NET, Android) dengan Postgres 16 |
| `.github/workflows/release.yml` | 2026-10-19 | 2026-10-19 | Otomatisasi rilis (PR "Version Packages") |

## .vscode

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `.vscode/settings.json` | 2026-10-22 | 2026-10-22 | Pengaturan VS Code untuk repo |

## android

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `android/app/build.gradle.kts` | 2026-10-19 | 2026-10-19 | Build Gradle modul app Android |
| `android/app/src/main/AndroidManifest.xml` | 2026-10-18 | 2026-10-18 | Manifest aplikasi Android |
| `android/app/src/main/java/com/app/mobile/contracts/UserContract.kt` | 2026-10-19 | 2026-10-19 | Kontrak User (Kotlin, kotlinx.serialization) |
| `android/app/src/test/java/com/app/mobile/contracts/UserContractTest.kt` | 2026-10-18 | 2026-10-18 | Tes kontrak User Android |
| `android/build.gradle.kts` | 2026-10-19 | 2026-10-19 | Build Gradle tingkat root Android |
| `android/gradle.properties` | 2026-10-18 | 2026-10-18 | Properti Gradle Android |
| `android/settings.gradle.kts` | 2026-10-18 | 2026-10-18 | Pengaturan proyek Gradle Android |

## apps/analog

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `apps/analog/.env.example` | 2026-10-20 | 2026-10-20 | Contoh variabel lingkungan |
| `apps/analog/.gitignore` | 2026-10-20 | 2026-10-20 | Berkas aplikasi Analog |
| `apps/analog/AGENTS.md` | 2026-10-20 | 2026-10-20 | Panduan agen AI untuk Analog |
| `apps/analog/CHANGELOG.md` | 2026-10-20 | 2026-10-20 | Changelog paket (dibuat Changesets) |
| `apps/analog/CLAUDE.md` | 2026-10-20 | 2026-10-20 | Panduan Claude untuk Analog |
| `apps/analog/README.md` | 2026-10-20 | 2026-10-20 | README Analog |
| `apps/analog/angular.json` | 2026-10-20 | 2026-10-20 | Konfigurasi Angular |
| `apps/analog/eslint.config.js` | 2026-10-20 | 2026-10-20 | Konfigurasi proyek |
| `apps/analog/index.html` | 2026-10-20 | 2026-10-20 | HTML induk SPA |
| `apps/analog/package.json` | 2026-10-20 | 2026-10-20 | Konfigurasi proyek |
| `apps/analog/public/favicon.ico` | 2026-10-20 | 2026-10-20 | Berkas aplikasi Analog |
| `apps/analog/scripts/verify-build.mjs` | 2026-10-20 | 2026-10-20 | Verifikasi hasil build |
| `apps/analog/src/app/app.config.ts` | 2026-10-20 | 2026-10-20 | Konfigurasi proyek |
| `apps/analog/src/app/app.spec.ts` | 2026-10-20 | 2026-10-20 | Berkas aplikasi Analog |
| `apps/analog/src/app/app.ts` | 2026-10-20 | 2026-10-20 | Berkas aplikasi Analog |
| `apps/analog/src/app/components/footer.component.ts` | 2026-10-20 | 2026-10-20 | Komponen UI |
| `apps/analog/src/app/components/sidebar.component.ts` | 2026-10-20 | 2026-10-20 | Komponen UI |
| `apps/analog/src/app/components/top-bar.component.ts` | 2026-10-20 | 2026-10-20 | Komponen UI |
| `apps/analog/src/app/core/config.ts` | 2026-10-20 | 2026-10-20 | Konfigurasi proyek |
| `apps/analog/src/app/guards/auth.guard.ts` | 2026-10-20 | 2026-10-20 | Guard rute |
| `apps/analog/src/app/interceptors/auth.interceptor.ts` | 2026-10-20 | 2026-10-20 | HTTP interceptor |
| `apps/analog/src/app/pages/(app).page.ts` | 2026-10-20 | 2026-10-20 | Halaman/rute Analog |
| `apps/analog/src/app/pages/(app)/home/index.page.ts` | 2026-10-20 | 2026-10-20 | Halaman/rute Analog |
| `apps/analog/src/app/pages/(app)/periods/index.page.ts` | 2026-10-20 | 2026-10-20 | Halaman/rute Analog |
| `apps/analog/src/app/pages/(app)/periods/periods.service.ts` | 2026-10-20 | 2026-10-20 | Halaman/rute Analog |
| `apps/analog/src/app/pages/(auth)/(auth).page.ts` | 2026-10-20 | 2026-10-20 | Halaman/rute Analog |
| `apps/analog/src/app/pages/(auth)/login.page.ts` | 2026-10-20 | 2026-10-20 | Halaman/rute Analog |
| `apps/analog/src/app/pages/(auth)/register.page.ts` | 2026-10-20 | 2026-10-20 | Halaman/rute Analog |
| `apps/analog/src/app/pages/index.page.ts` | 2026-10-20 | 2026-10-20 | Halaman/rute Analog |
| `apps/analog/src/app/routes/index.ts` | 2026-10-20 | 2026-10-20 | Berkas aplikasi Analog |
| `apps/analog/src/app/services/auth.service.ts` | 2026-10-20 | 2026-10-20 | Layanan |
| `apps/analog/src/app/shared/icon.ts` | 2026-10-20 | 2026-10-20 | Berkas aplikasi Analog |
| `apps/analog/src/app/shared/logo.ts` | 2026-10-20 | 2026-10-20 | Berkas aplikasi Analog |
| `apps/analog/src/app/store/auth.store.ts` | 2026-10-20 | 2026-10-20 | State store |
| `apps/analog/src/main.ts` | 2026-10-20 | 2026-10-20 | Titik masuk Angular |
| `apps/analog/src/setup-tests.ts` | 2026-10-20 | 2026-10-20 | Berkas aplikasi Analog |
| `apps/analog/src/styles.css` | 2026-10-20 | 2026-10-20 | Gaya global (Tailwind v4) |
| `apps/analog/src/vite-env.d.ts` | 2026-10-20 | 2026-10-20 | Berkas aplikasi Analog |
| `apps/analog/tsconfig.app.json` | 2026-10-20 | 2026-10-20 | Konfigurasi proyek |
| `apps/analog/tsconfig.json` | 2026-10-20 | 2026-10-20 | Konfigurasi proyek |
| `apps/analog/tsconfig.spec.json` | 2026-10-20 | 2026-10-20 | Konfigurasi proyek |
| `apps/analog/vite.config.ts` | 2026-10-20 | 2026-10-20 | Konfigurasi proyek |
| `apps/analog/vitest.config.ts` | 2026-10-20 | 2026-10-20 | Konfigurasi proyek |

## apps/api

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `apps/api/CHANGELOG.md` | 2026-10-20 | 2026-10-20 | Changelog @app/api |
| `apps/api/package.json` | 2026-10-18 | 2026-10-20 | Paket @app/api (rencana dihapus, ADR 0011) |
| `apps/api/src/app.test.ts` | 2026-10-19 | 2026-10-18 | Tes tiruan, tanpa kode produksi |
| `apps/api/tsconfig.json` | 2026-10-18 | 2026-10-20 | TypeScript config @app/api |

## docs

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `docs/ALUR-BACKEND.md` | 2026-10-19 | 2026-10-19 | Dokumentasi |
| `docs/CI-PIPELINE.md` | 2026-10-19 | 2026-10-19 | Dokumentasi |
| `docs/DEPLOY-RENDER.md` | 2026-10-19 | 2026-10-20 | Dokumentasi |
| `docs/MIGRASI-ANALOG.md` | 2026-10-19 | 2026-10-22 | Dokumentasi |
| `docs/MIGRASI-ASPNET-ACCOUNTING.md` | 2026-10-20 | 2026-10-22 | Dokumentasi |
| `docs/MIGRASI-ASPNET-NEST.md` | 2026-10-20 | 2026-10-22 | Dokumentasi |
| `docs/MIGRASI-NEST.md` | 2026-10-18 | 2026-10-19 | Dokumentasi |
| `docs/PETA-RUTE-NEXT.md` | 2026-10-22 | 2026-10-22 | Dokumentasi |
| `docs/SCHEMA-MAPPING.md` | 2026-10-22 | 2026-10-22 | Dokumentasi |
| `docs/SCRIPTS.md` | 2026-10-20 | 2026-10-20 | Dokumentasi |
| `docs/adr/0001-record-architecture-decisions.md` | 2026-10-18 | 2026-10-18 | Catatan keputusan arsitektur (ADR) |
| `docs/adr/0002-use-pnpm-and-nx-monorepo.md` | 2026-10-18 | 2026-10-18 | Catatan keputusan arsitektur (ADR) |
| `docs/adr/0003-use-zod-contracts-and-pino-logging.md` | 2026-10-19 | 2026-10-19 | Catatan keputusan arsitektur (ADR) |
| `docs/adr/0004-polyglot-architecture-and-contract-validation.md` | 2026-10-19 | 2026-10-19 | Catatan keputusan arsitektur (ADR) |
| `docs/adr/0005-automated-releases-and-dependency-governance.md` | 2026-10-19 | 2026-10-19 | Catatan keputusan arsitektur (ADR) |
| `docs/adr/0006-go-auth-service-cookie-and-jwt.md` | 2026-10-18 | 2026-10-18 | Catatan keputusan arsitektur (ADR) |
| `docs/adr/0007-nest-masuk-monorepo.md` | 2026-10-19 | 2026-10-19 | Catatan keputusan arsitektur (ADR) |
| `docs/adr/0008-analog-frontend-masuk-monorepo.md` | 2026-10-20 | 2026-10-20 | Catatan keputusan arsitektur (ADR) |
| `docs/adr/0009-aspnet-akuntansi-masuk-monorepo.md` | 2026-10-20 | 2026-10-21 | Catatan keputusan arsitektur (ADR) |
| `docs/adr/0010-duplikasi-backend-ke-nest.md` | 2026-10-20 | 2026-10-22 | Catatan keputusan arsitektur (ADR) |
| `docs/adr/0011-next-menggantikan-analog-api-ditangani-nest.md` | 2026-10-22 | 2026-10-22 | Catatan keputusan arsitektur (ADR) |

## gateway

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `gateway/default.conf` | 2026-10-19 | 2026-10-21 | Konfigurasi gateway Nginx |

## libs/contracts

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `libs/contracts/CHANGELOG.md` | 2026-10-20 | 2026-10-20 | Changelog paket (dibuat Changesets) |
| `libs/contracts/package.json` | 2026-10-19 | 2026-10-20 | Paket @app/contracts |
| `libs/contracts/src/auth.schema.ts` | 2026-10-20 | 2026-10-20 | Skema Zod auth |
| `libs/contracts/src/auth.ts` | 2026-10-20 | 2026-10-20 | Tipe auth |
| `libs/contracts/src/index.ts` | 2026-10-19 | 2026-10-20 | Ekspor seluruh kontrak |
| `libs/contracts/src/periods.schema.ts` | 2026-10-20 | 2026-10-20 | Skema Zod periode |
| `libs/contracts/src/periods.ts` | 2026-10-20 | 2026-10-20 | Tipe periode |
| `libs/contracts/src/user.schema.ts` | 2026-10-20 | 2026-10-20 | Skema Zod pengguna |
| `libs/contracts/src/user.ts` | 2026-10-19 | 2026-10-20 | Tipe pengguna |
| `libs/contracts/tsconfig.json` | 2026-10-18 | 2026-10-18 | TypeScript config contracts |

## libs/logger

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `libs/logger/package.json` | 2026-10-18 | 2026-10-19 | Paket @app/logger |
| `libs/logger/src/index.ts` | 2026-10-19 | 2026-10-19 | Logger Pino terstruktur |
| `libs/logger/tsconfig.json` | 2026-10-18 | 2026-10-19 | TypeScript config logger |

## libs/sdk

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `libs/sdk/CHANGELOG.md` | 2026-10-20 | 2026-10-20 | Changelog paket (dibuat Changesets) |
| `libs/sdk/package.json` | 2026-10-19 | 2026-10-20 | Paket @app/sdk |
| `libs/sdk/src/index.ts` | 2026-10-19 | 2026-10-18 | SDK klien API |
| `libs/sdk/tsconfig.json` | 2026-10-18 | 2026-10-18 | TypeScript config sdk |

## native/core_engine

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `native/core_engine/Cargo.toml` | 2026-10-19 | 2026-10-19 | Crate Rust core_engine |
| `native/core_engine/src/lib.rs` | 2026-10-19 | 2026-10-18 | Pustaka Rust core_engine |

## native/cpp_calc

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `native/cpp_calc/include/aumo_calc.h` | 2026-10-20 | 2026-10-20 | Header C++ kalkulasi |

## native/workers

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `native/workers/Cargo.toml` | 2026-10-20 | 2026-10-20 | Crate Rust workers |
| `native/workers/src/main.rs` | 2026-10-20 | 2026-10-20 | Worker Rust (titik masuk) |

## package/sdk-typescript

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `package/sdk-typescript/Tes.txt` | 2026-10-20 | 2026-10-20 | Berkas percobaan (placeholder) |

## scripts

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `scripts/build-cpp-calc.sh` | 2026-10-20 | 2026-10-20 | Skrip build modul C++ |
| `scripts/init-php-dashboard.sh` | 2026-10-20 | 2026-10-20 | Skrip inisialisasi dashboard PHP |
| `scripts/run-rust-worker.sh` | 2026-10-20 | 2026-10-20 | Skrip menjalankan worker Rust |
| `scripts/validate-contracts.ts` | 2026-10-19 | 2026-10-20 | Validasi kontrak lintas bahasa |

## services/auth

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `services/auth/Dockerfile` | 2026-10-19 | 2026-10-19 | Dockerfile layanan auth |
| `services/auth/cmd/server/main.go` | 2026-10-18 | 2026-10-20 | Titik masuk server auth Go (port 8080) |
| `services/auth/go.mod` | 2026-10-18 | 2026-10-20 | Modul Go (Go 1.22) |
| `services/auth/go.sum` | 2026-10-19 | 2026-10-20 | Checksum dependensi Go |
| `services/auth/pkg/handlers/handler.go` | 2026-10-19 | 2026-10-20 | Handler HTTP: register, login, OAuth, validasi |
| `services/auth/pkg/handlers/handler_test.go` | 2026-10-19 | 2026-10-20 | Tes handler |
| `services/auth/pkg/password/password.go` | 2026-10-19 | 2026-10-19 | Hash dan verifikasi kata sandi |
| `services/auth/pkg/password/password_test.go` | 2026-10-19 | 2026-10-19 | Tes kata sandi |
| `services/auth/pkg/store/memory.go` | 2026-10-20 | 2026-10-20 | Penyimpanan pengguna in-memory |
| `services/auth/pkg/store/postgres.go` | 2026-10-20 | 2026-10-20 | Penyimpanan pengguna PostgreSQL |
| `services/auth/pkg/store/postgres_test.go` | 2026-10-20 | 2026-10-20 | Tes penyimpanan PostgreSQL |
| `services/auth/pkg/store/store.go` | 2026-10-19 | 2026-10-20 | Antarmuka penyimpanan |
| `services/auth/pkg/tokens/jwt.go` | 2026-10-18 | 2026-10-19 | Penerbit dan verifikasi JWT |
| `services/auth/pkg/tokens/jwt_test.go` | 2026-10-19 | 2026-10-19 | Tes JWT |

## system

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `system/cpp/Tes.txt` | 2026-10-20 | 2026-10-20 | Berkas percobaan (placeholder) |

## templates

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `templates/lib/index.ts.hbs` | 2026-10-19 | 2026-10-19 | Templat Plop: index.ts pustaka baru |
| `templates/lib/package.json.hbs` | 2026-10-19 | 2026-10-19 | Templat Plop: package.json pustaka baru |
| `templates/lib/tsconfig.json.hbs` | 2026-10-19 | 2026-10-19 | Templat Plop: tsconfig pustaka baru |

## tools/cli

| Berkas | Dibuat | Diperbarui | Fungsi |
| --- | --- | --- | --- |
| `tools/cli/package.json` | 2026-10-19 | 2026-10-19 | Paket @app/cli |
| `tools/cli/src/cli.js` | 2026-10-19 | 2026-10-19 | CLI internal |

## Folder terkunci (under construction)

Tidak dipetakan per berkas. Jangan diubah sampai statusnya dicabut.

| Folder | Fungsi | Dibuat | Diperbarui | Jumlah berkas |
| --- | --- | --- | --- | --- |
| `dotnet/` | Backend akuntansi ASP.NET Core (Aumo.Accounting.Api, Tests) | 2026-10-19 | 2026-10-22 | 84 |
| `apps/nest/` | API NestJS 11 (Drizzle, Redis/BullMQ, Scalar) | 2026-10-19 | 2026-10-22 | 98 |
| `apps/next/` | Frontend Next.js (pengganti Analog) | 2026-10-22 | 2026-10-22 | 1097 |
