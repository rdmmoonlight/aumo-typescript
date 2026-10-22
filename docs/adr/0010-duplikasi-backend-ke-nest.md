# 0010. Sisa `/backend` diduplikasi ke `apps/nest`

(status *Proposed*. Menjadi *Accepted* setelah Fase 9 di `docs/MIGRASI-ASPNET-NEST.md` selesai.)

## Konteks

ADR 0009 memindahkan Reports, Periods, dan ChartOfAccounts ke ASP.NET Core di `dotnet/`.
Folder `backend/` di aumo-finance masih memuat bagian lain yang belum punya padanan di monorepo:

| Bagian | Isi |
| --- | --- |
| Controller non-akuntansi | `Health`, `Core`, `Home`, `Dashboard`, `Notifications`, `Avatars`, `JournalEntry`, `Tools`, `Settings` (9 controller, 26 endpoint, ≈4.300 baris dengan service). `Core` dan `guardian/*` dikeluarkan dari cakupan (lihat Keputusan 11 dan 12), sehingga 21 endpoint dipetakan |
| `Auth` | Sudah ditangani `services/auth` (Go) |
| `axum/` | Rust FFI 34 baris (`get_salam`) |
| `go/`, `python/` | Placeholder (`Test.txt`) |

Tujuannya: seluruh isi `/backend` memiliki padanan di `aumo-typescript`.
Peta fase: [`docs/MIGRASI-ASPNET-NEST.md`](../MIGRASI-ASPNET-NEST.md).

## Keputusan

1. Delapan controller non-akuntansi (tanpa `Core`) diduplikasi sebagai modul Nest di `apps/nest/src/modules/<nama>/`.
2. Pola duplikasi: tidak ada kode yang dihapus di aumo-finance.
3. `AuthController` tidak diduplikasi. `services/auth` (Go) tetap otoritas tunggal (ADR 0006, 0007).
4. Identitas dibaca dari `X-User-Id` oleh guard Nest yang sudah ada.
5. Skema tetap milik Drizzle. Tabel baru: `notifications`. Migrasi dijalankan manual ke Neon.
6. Perhitungan laporan tidak ditulis ulang di Nest. Aturan yang terpaksa ada di dua tempat (`PeriodLock`, nomor transaksi) dikunci dengan tes paritas terhadap backend lama.
7. `profile`, `change-password`, dan `delete-account` mengubah `auth.users` milik Go, sehingga dilayani Go. Nest hanya memiliki `avatar`. `guardian/*` tidak diduplikasi (Keputusan 12).
8. Validasi FluentValidation menjadi Zod 4. Impor Excel memakai `exceljs`. Hangfire tidak dibawa.
9. `axum/` tidak diduplikasi (lihat Keputusan 11).
10. `go/` dan `python/` tidak berisi kode, tidak ada yang disalin.
11. `CoreController` (`/api/core/salam`), `RustCoreService`, `CoreControllerTests`, dan `axum/` **tidak diduplikasi.** Di sumber semuanya *dead code*. Tidak ada modul `core` di Nest.
12. `guardian/*` (3 endpoint di `SettingsController`) dan tabel pendukungnya (`login_activities`, `user_sessions`, `security_settings`, `trusted_devices`, `recovery_codes`) **tidak diduplikasi.**

```
Browser ──► Nginx ($PORT)
              ├─ /api/auth/*, /api/settings/{profile,change-password,delete-account} → Go
              ├─ /api/reports|periods|chart-of-accounts/*  → auth_request → .NET (5100)
              ├─ /api/avatars/*                            → Nest (publik)
              └─ /api/*  (dashboard, journal-entry, tools, notifications, home, settings/avatar) → auth_request → Nest (5000)
```

## Daftar Endpoint dan Pemilik

Gateway Nginx menambah awalan `/api`. Total sumber: 26 endpoint. Dipetakan: **21** (18 milik Nest, 3 milik Go). Dikeluarkan: 5.

| # | Metode | Rute sumber | Pemilik | Modul / catatan | Fase |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/health` | Nest | `health` | 4 |
| 2 | GET | `/kurs` | Nest | `home` (publik) | 4 |
| 3 | GET | `/home/market-indicators` | Nest | `home` | 4 |
| 4 | GET | `/notifications` | Nest | `notifications` | 4 |
| 5 | PUT | `/notifications/{id}/read` | Nest | `notifications` | 4 |
| 6 | PUT | `/notifications/read-all` | Nest | `notifications` | 4 |
| 7 | GET | `/avatars/{fileName}` | Nest | `avatars` (publik) | 4 |
| 8 | GET | `/dashboard` | Nest | `dashboard` | 5 |
| 9 | GET | `/journal-entry/{id}` | Nest | `journal-entries` | 5 |
| 10 | POST | `/journal-entry/create` | Nest | `journal-entries` | 5 |
| 11 | PUT | `/journal-entry/edit/{id}` | Nest | `journal-entries` | 5 |
| 12 | DELETE | `/journal-entry/delete/{id}` | Nest | `journal-entries` | 5 |
| 13 | GET | `/journal-entry/search-descriptions` | Nest | `journal-entries` | 5 |
| 14 | GET | `/journal-entry/next-transaction-number` | Nest | `journal-entries` | 5 |
| 15 | GET | `/tools/download-journal-template` | Nest | `tools` | 6 |
| 16 | POST | `/tools/preview-journal-import` | Nest | `tools` | 6 |
| 17 | POST | `/tools/import-journal-entries` | Nest | `tools` | 6 |
| 18 | POST | `/settings/avatar` | Nest | `settings` | 7 |
| 19 | PUT | `/settings/profile` | **Go** | `services/auth` | 7 |
| 20 | POST | `/settings/change-password` | **Go** | `services/auth` | 7 |
| 21 | DELETE | `/settings/delete-account` | **Go** | `services/auth` | 7 |
| - | GET, POST | `/api/core/salam` | tidak diduplikasi | dead code di sumber | - |
| - | GET | `/settings/guardian/dashboard` | tidak diduplikasi | guardian | - |
| - | POST | `/settings/guardian/revoke-session/{id}` | tidak diduplikasi | guardian | - |
| - | POST | `/settings/guardian/revoke-all-sessions` | tidak diduplikasi | guardian | - |

Rute `/` dan `HEAD /` di Nest hanya penanda server hidup dan tidak dihitung.

## Alternatif yang Ditolak

| Alternatif | Alasan ditolak |
| --- | --- |
| Memindahkan semua controller ke .NET | Nest sudah memiliki infrastruktur (Drizzle, Redis, BullMQ, S3). Dashboard, jurnal, dan notifikasi tidak membutuhkan mesin laporan |
| Nest memanggil .NET untuk Dashboard | Dashboard hanya membaca tabel yang sudah ada di Drizzle. Panggilan antar layanan menambah latensi dan titik gagal |
| Menyalin Identity (`SettingsService`) ke Nest | Dua pemilik `auth.users`. Bertentangan dengan ADR 0006 |
| Membawa Hangfire | Tidak ada job terdaftar di sumber |
| Membawa Rust FFI ke Node | Tidak ada manfaat untuk satu fungsi "salam". Menambah kompleksitas build |

## Akibat

**Positif**
- Seluruh isi `/backend` memiliki padanan. Satu stack per domain: akuntansi di .NET, sisanya di Nest, auth di Go.
- Tanpa biaya tambahan.

**Negatif dan risiko**
- `PeriodLock` dan nomor transaksi hidup di dua bahasa. Mitigasi: tes paritas Fase 5.
- Tiga endpoint Settings berpindah ke Go, pekerjaan di luar `apps/nest`.
- Impor Excel menambah beban memori pada container bersama (512 MB, 4 proses). Batas ukuran berkas dan baris diterapkan.

## Syarat Diterima (*Accepted*)

- [ ] Endpoint Nest (milik Nest pada tabel di atas) lolos uji asap dan tes paritas respons terhadap backend lama.
- [ ] Tes paritas `PeriodLock` dan nomor transaksi hijau.
- [ ] Changeset ditambahkan.

## Rujukan

- ADR 0004, 0006, 0007, 0009.
- `docs/MIGRASI-ASPNET-NEST.md` (inventaris, temuan, 9 fase, risiko).
- `docs/MIGRASI-ASPNET-ACCOUNTING.md` (bagian akuntansi).
