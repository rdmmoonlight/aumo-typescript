# 0010. Sisa `/backend` diduplikasi ke `apps/nest`

(status *Proposed*. Menjadi *Accepted* setelah Fase 9 di `docs/MIGRASI-ASPNET-NEST.md` selesai.)

## Konteks

ADR 0009 memindahkan Reports, Periods, dan ChartOfAccounts ke ASP.NET Core di `dotnet/`.
Folder `backend/` di aumo-finance masih memuat bagian lain yang belum punya padanan di monorepo:

| Bagian | Isi |
| --- | --- |
| Controller non-akuntansi | `Health`, `Core`, `Home`, `Dashboard`, `Notifications`, `Avatars`, `JournalEntry`, `Tools`, `Settings` (9 controller, 26 endpoint, ≈4.300 baris dengan service) |
| `Auth` | Sudah ditangani `services/auth` (Go) |
| `axum/` | Rust FFI 34 baris (`get_salam`) |
| `go/`, `python/` | Placeholder (`Test.txt`) |

Tujuannya: seluruh isi `/backend` memiliki padanan di `aumo-typescript`.
Peta fase: [`docs/MIGRASI-ASPNET-NEST.md`](../MIGRASI-ASPNET-NEST.md).

## Keputusan

1. Sembilan controller non-akuntansi diduplikasi sebagai modul Nest di `apps/nest/src/modules/<nama>/`.
2. Pola duplikasi: tidak ada kode yang dihapus di aumo-finance.
3. `AuthController` tidak diduplikasi. `services/auth` (Go) tetap otoritas tunggal (ADR 0006, 0007).
4. Identitas dibaca dari `X-User-Id` oleh guard Nest yang sudah ada.
5. Skema tetap milik Drizzle. Tabel baru: `notifications`, `login_activities`, `user_sessions`, `security_settings` (dan dua tabel 2FA bila terbukti dipakai). Migrasi dijalankan manual ke Neon.
6. Perhitungan laporan tidak ditulis ulang di Nest. Aturan yang terpaksa ada di dua tempat (`PeriodLock`, nomor transaksi) dikunci dengan tes paritas terhadap backend lama.
7. `profile`, `change-password`, dan `delete-account` mengubah `auth.users` milik Go, sehingga dilayani Go. Nest memiliki `avatar` dan `guardian/*`.
8. Validasi FluentValidation menjadi Zod 4. Impor Excel memakai `exceljs`. Hangfire tidak dibawa.
9. `axum/` diduplikasi ke `native/core_engine` sebagai fungsi Rust biasa. Endpoint Nest `core/salam` memakai TypeScript.
10. `go/` dan `python/` tidak berisi kode, tidak ada yang disalin.

```
Browser ──► Nginx ($PORT)
              ├─ /api/auth/*, /api/settings/{profile,change-password,delete-account} → Go
              ├─ /api/reports|periods|chart-of-accounts/*  → auth_request → .NET (5100)
              ├─ /api/avatars/*                            → Nest (publik)
              └─ /api/*  (dashboard, journal-entry, tools, notifications, home, core, settings) → auth_request → Nest (5000)
```

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
- Fitur guardian bergantung pada Go (pencatatan sesi). Tanpa itu fitur tidak diaktifkan.
- Tiga endpoint Settings berpindah ke Go, pekerjaan di luar `apps/nest`.
- Impor Excel menambah beban memori pada container bersama (512 MB, 4 proses). Batas ukuran berkas dan baris diterapkan.

## Syarat Diterima (*Accepted*)

- [ ] 26 endpoint Nest lolos uji asap dan tes paritas respons terhadap backend lama.
- [ ] Tes paritas `PeriodLock` dan nomor transaksi hijau.
- [ ] Sesi guardian yang dicabut ditolak oleh Go pada permintaan berikutnya.
- [ ] Changeset ditambahkan.

## Rujukan

- ADR 0004, 0006, 0007, 0009.
- `docs/MIGRASI-ASPNET-NEST.md` (inventaris, temuan, 9 fase, risiko).
- `docs/MIGRASI-ASPNET-ACCOUNTING.md` (bagian akuntansi).
