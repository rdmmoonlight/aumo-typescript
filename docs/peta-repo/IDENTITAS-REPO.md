# Identitas Repo

> Dibuat: 2026-10-23 · Diperbarui: 2026-10-23 · Basis commit: `2be4ad7`

## Umum

| Atribut | Nilai |
| --- | --- |
| Nama repo | `aumo-typescript` (judul README: `aumo_typescript`) |
| Nama paket root | `auts` (versi 1.0.0, private) |
| Pemilik | `rdmmoonlight` |
| URL | <https://github.com/rdmmoonlight/aumo-typescript> |
| Branch utama | `main` (cabang bantu: `changeset-release/main`) |
| Commit pertama | 2026-10-18 |
| Jumlah commit (saat dokumen dibuat) | 219 |
| Penulis commit | Obscuron, rdmmoonlight, Claude, github-actions[bot] |
| Lisensi | Tidak ada berkas LICENSE |
| Bahasa dokumentasi | Indonesia |
| Repo terkait | `rdmmoonlight/aumo-finance` (sumber migrasi/duplikasi kode) |

## Tujuan

Monorepo polyglot untuk aplikasi akuntansi Aumo: auth, API, backend akuntansi, frontend web, dan klien Android dalam satu repo. Kode dari `aumo-finance` diduplikasi ke sini secara bertahap (lihat `docs/MIGRASI-*.md`).

## Toolchain

| Komponen | Versi / Alat |
| --- | --- |
| Node.js | >= 24.0.0 |
| pnpm | 12.14.0 (`packageManager`) |
| Build system | Nx 23 + pnpm workspace (`apps/*`, `libs/*`) |
| TypeScript | ~5.6.3 |
| Validasi / log | Zod 4, Pino 10 |
| Tes | Vitest, Supertest |
| Go | 1.22 (`services/auth`) |
| Rust | stable, Cargo workspace (`native/`) |
| .NET | SDK 10.0 (`dotnet/`) |
| Android | Kotlin, Java 17, kotlinx.serialization |
| Rilis | Changesets; dependensi: Renovate; scaffolding: Plop |

## Paket Workspace

| Paket | Lokasi | Versi | Status |
| --- | --- | --- | --- |
| `@app/contracts` | `libs/contracts` | 1.2.0 | Aktif (skema Zod) |
| `@app/logger` | `libs/logger` | 1.0.0 | Aktif |
| `@app/sdk` | `libs/sdk` | 1.0.2 | Aktif |
| `@app/cli` | `tools/cli` | 1.0.0 | Aktif |
| `@app/analog` | `apps/analog` | 7.0.0 | Digantikan `apps/next` (ADR 0011) |
| `@app/nest` | `apps/nest` | - | Terkunci (under construction) |
| `@app/next` | `apps/next` | - | Terkunci (under construction) |

## Deploy

| Atribut | Nilai |
| --- | --- |
| Platform | Render, satu service Docker `aumo-api` (auto deploy) |
| Blueprint | `render.yaml`, build dari `Dockerfile` root |
| Health check | `/health` |
| Port publik | `$PORT` (lokal 10000) lewat Nginx |
| Basis data | PostgreSQL (Neon), `DATABASE_URL` |
| Cache/antrean | Redis, `REDIS_URL` |
| Penyimpanan objek | S3-kompatibel (`AWS_*`, `S3_BUCKET`) |
| Rahasia (nama saja) | `JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`, `FRONTEND_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URL`, `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET` |

Nilai rahasia tidak boleh dicatat di repo.

## Konvensi

- Commit: Conventional Commits (`feat`, `fix`, `docs`, `chore`).
- Branch: `feat/nama-fitur`, `fix/nama-bug`.
- Pra-PR: `pnpm run lint`, `typecheck`, `test`, `build`; tambah changeset (`pnpm exec changeset`) bila perubahan bermakna.
- Keputusan arsitektur besar wajib ADR baru di `docs/adr/00xx-nama.md`.

## Folder Terkunci

`dotnet/`, `apps/nest/`, `apps/next/` berstatus under construction. Jangan diubah oleh manusia maupun AI tanpa izin pemilik. Rincian: `PETA-FILE.md` bagian akhir.
