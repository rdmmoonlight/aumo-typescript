# Peta Migrasi: Aumo Mobile (Kotlin Native) → Capacitor + TypeScript (Android)

> Status: **PEMETAAN SAJA.** Dokumen ini tidak mengubah kode apa pun.
> Sumber: folder `/mobile` (Kotlin, Jetpack Compose, Ktor). Backend `/backend` tidak diubah.

---

## 1. Ringkasan Keputusan

| Pos | Keputusan |
|---|---|
| Folder target | `/mobile-capacitor` (baru, berdampingan). `/mobile` tetap utuh sampai Fase 10 |
| Bahasa | TypeScript (strict) |
| UI | TypeScript murni (`.ts`, tanpa React/JSX/`.tsx`/`.vue`) + Vite + Tailwind 4; DOM lewat fungsi `h()` |
| State & data | Store kecil + cache query buatan sendiri (tanpa Redux/RTK Query) |
| Platform | Android saja. `minSdk` 28 **dikunci**, `targetSdk` 34 |
| Identitas app | `applicationId` tetap `com.bnrc.aumofinance` + keystore rilis yang sama |
| Auth | JWT Bearer (tetap), token disimpan terenkripsi |
| Build | GitHub Actions saja (tanpa PC / Android Studio lokal) |
| Biaya | Nol. Semua alat gratis (Capacitor, GitHub Actions, Sentry free tier bila dipakai) |
| Aturan backend | Tidak ada endpoint/skema baru dari sisi mobile. Perubahan API masuk `/backend` |

## 2. Inventaris Baseline (`/mobile`)

| Kelompok | Jumlah | Isi |
|---|---|---|
| Activity (layar) | 24 | Splash, Login, Home, Dashboard, Periods, COA, JournalEntry, ReportsMenu, GeneralJournal, AdjustingJournal, GL Permanent, GL Temporary, TB Unadjusted/Adjusted/PostClosing, Worksheet, IncomeStatement, RetainedEarnings, FinancialPosition, ClosingJournal, CashFlow, Settings, CrashLog, Logout |
| Modul API | 10+ | `AuthApi`, `PeriodsApi`, `CoaApi`, `JournalApi`, `JournalReportApi`, `LedgerApi`, `TrialBalanceApi`, `WorksheetApi`, `FinancialsApi`, `DashboardApi` |
| Layanan inti | 6 | `ApiClient` (Ktor), `SessionManager/Store`, `BiometricHelper`, `AppUpdateService`, `CrashLogHandler/AppLogger`, `CurrencyFormatter` |
| Placeholder | 2 | `SyncManager` (no-op), `DbConnectionManager` |
| Total file | 126 | |

## 3. Pemetaan Komponen Native → Capacitor

| Kotlin (asal) | Capacitor/TypeScript (tujuan) | Catatan |
|---|---|---|
| Activity + `setContent` | Route vanilla (SPA, `mount(container) => cleanup`) | 1 Activity → 1 route |
| ViewModel + coroutines | Fungsi async + store kecil | `try/catch` → status query |
| Ktor + Gson | `CapacitorHttp` / `fetch` | Request native, bebas CORS |
| `ApiClient` BASE_URL + timeout 45 dtk | `apiClient.ts` + env `VITE_API_URL` | Timeout 45 dtk wajib (cold start Render) |
| `EncryptedSharedPreferences` | Plugin secure storage (Keystore) | `@capacitor/preferences` **tidak** terenkripsi, jangan dipakai untuk token |
| `BiometricPrompt` | Plugin biometric auth | Perlu uji perangkat Android 9 |
| Jetpack Compose Material3 | Komponen fungsi `.ts` + Tailwind | Token dari `docs/typography-scale.md`, `docs/spacing-scale.md` |
| `AumoDatePickerDialog` | Date picker web (input date / pustaka ringan) | |
| `CurrencyFormatter` | `Intl.NumberFormat('id-ID')` | Uji paritas angka |
| `SplashActivity` | Layar splash di dalam app (`/splash`, gambar penuh logo + atribusi) | Bukan plugin `@capacitor/splash-screen`: desain penuh, sama alasannya dengan `SplashActivity.kt` |
| `AppUpdateService` (APK dari GitHub Releases) | Plugin native kustom (Kotlin) + `@capacitor/filesystem` | Butuh FileProvider + `REQUEST_INSTALL_PACKAGES` |
| `CrashLogHandler` | `window.onerror` + log file + handler native | Layar CrashLog tetap ada |
| Tombol Back Android | `@capacitor/app` | |
| Snackbar / ConfirmDialog | Komponen fungsi `.ts` | |

## 4. Fase Migrasi (10 Fase)

### Fase 1 — Baseline & Kontrak
- [x] Bekukan fitur baru di `/mobile` selama migrasi.
- [x] Catat kontrak tiap endpoint yang dipakai (path absolut `/...`).
- [x] Tetapkan matriks paritas: 24 layar × status.
- [x] **Keluaran:** `docs/parity-matrix.md`. **Selesai bila:** semua layar dan endpoint tercatat.

### Fase 2 — Scaffolding Capacitor + TypeScript
- [x] Buat `/mobile-capacitor` (Vite + TS strict tanpa React, ESLint, Prettier).
- [x] `npx cap add android`; set `minSdk 28`, `targetSdk 34`, `appId com.bnrc.aumofinance`.
- [x] Workflow GitHub Actions: build APK debug otomatis.
- [x] **Keluaran:** APK debug "Hello" terpasang di Android 9. **Selesai bila:** CI hijau.

### Fase 3 — Fondasi UI & Tema
- [x] Pindahkan token warna (Ningrat Purple / Matte Black), tipografi, jarak ke Tailwind.
- [x] Bangun komponen dasar: Button (min 48px), Input, Card, Dialog, Snackbar, TopBar, List, Skeleton.
- [x] Ikon Tabler versi web.
- [x] **Keluaran:** katalog komponen internal. **Selesai bila:** token setara `Theme.kt` dan `Dimens.kt`.

### Fase 4 — Jaringan, Sesi, Logger
- [x] `apiClient.ts`: Bearer interceptor, timeout 45 dtk, penanganan 401 → logout.
- [x] Penyimpanan token terenkripsi + fitur "Ingat saya".
- [x] Logger terpusat + layar CrashLog (padanan `AppLogger`, `CrashLogHandler`).
- [x] Format mata uang dan tanggal (`id-ID`), tanpa pergeseran zona waktu.
- [x] **Keluaran:** lapisan data teruji. **Selesai bila:** login API sukses dari perangkat.

### Fase 5 — Splash, Login, Biometrik, Navigasi
- [x] Router, guard autentikasi, penanganan tombol Back.
- [x] Splash → Login → Home. Biometrik opsional setelah login pertama.
- [x] Layar Logout.
- [ ] **Keluaran:** alur masuk-keluar utuh. **Selesai bila:** sesi bertahan setelah app ditutup.

### Fase 6 — Home, Dashboard, Periods
- [ ] Home dan Dashboard (`DashboardApi`).
- [ ] Periods: daftar, pilih, tutup, buat periode.
- [ ] Kontrak create-period (Month/Year/SetupMode + akun dari `/open-info`) **diverifikasi ulang ke backend live** sebelum kode ditulis.
- [ ] **Selesai bila:** periode terpilih tersimpan di server dan konsisten di semua layar.

### Fase 7 — COA & Jurnal Umum (Input)
- [ ] COA: daftar, tambah, ubah. Kategori sesuai rentang nomor (Aset 100–199 … Beban Lain 800–999).
- [ ] Journal Entry: baris debit/kredit, validasi seimbang, tanggal tanpa pergeseran zona waktu.
- [ ] **Selesai bila:** jurnal tersimpan dan muncul di laporan.

### Fase 8 — Laporan Bagian 1: Jurnal, Buku Besar, Neraca Saldo, Worksheet
- [ ] Menu laporan; Jurnal Umum dan Penyesuaian (termasuk hapus jurnal penyesuaian).
- [ ] Buku Besar: **dua endpoint terpisah** (`/permanent`, `/temporary`).
- [ ] Neraca Saldo: **satu endpoint** `type=unadjusted|adjusted|post-closing`.
- [ ] Worksheet.
- [ ] **Selesai bila:** angka sama dengan app Kotlin pada periode uji yang sama.

### Fase 9 — Laporan Bagian 2 + Pengaturan + Auto-Update
- [ ] Laba Rugi, Perubahan Laba Ditahan, Posisi Keuangan, Arus Kas.
- [ ] Jurnal Penutup: dihitung dari Neraca Saldo, **tidak disimpan**.
- [ ] Settings (toggle auto-update).
- [ ] Plugin native `AppUpdate`: cek GitHub Releases, unduh APK, pasang. Bandingkan versi per segmen numerik.
- [ ] **Selesai bila:** update dari rilis lama ke rilis baru berhasil di perangkat.

### Fase 10 — Hardening, Rilis, Cutover
- [ ] Uji paritas penuh (24 layar), uji Android 9 dan versi terbaru, uji koneksi lambat/offline.
- [ ] Signing rilis dengan keystore lama, versi CalVer, publikasi GitHub Release otomatis.
- [ ] Pemeriksaan ukuran APK, performa render tabel laporan besar, aksesibilitas dasar.
- [ ] Cutover: promosi ke `main` oleh pemilik; `/mobile` diarsipkan, bukan dihapus.
- [ ] **Selesai bila:** APK Capacitor menimpa instalasi Kotlin tanpa kehilangan data login.

## 5. Ringkasan Bobot Kerja

| Fase | Cakupan | Bobot |
|---|---|---:|
| 1 | Baseline & kontrak | 5% |
| 2 | Scaffolding + CI | 8% |
| 3 | Fondasi UI | 10% |
| 4 | Jaringan, sesi, logger | 10% |
| 5 | Splash, login, biometrik, navigasi | 10% |
| 6 | Home, Dashboard, Periods | 12% |
| 7 | COA & Journal Entry | 12% |
| 8 | Laporan bagian 1 | 12% |
| 9 | Laporan bagian 2, Settings, Auto-Update | 14% |
| 10 | Hardening, rilis, cutover | 7% |
| | **Total** | **100%** |

## 6. Register Risiko

| # | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| 1 | Keystore rilis berbeda | App dianggap baru, user lama tidak ter-update | Pakai keystore dan `applicationId` yang sama |
| 2 | Token disimpan tanpa enkripsi | Kebocoran sesi | Secure storage berbasis Keystore, bukan Preferences |
| 3 | Plugin auto-update native belum ada | Fitur update hilang | Tulis plugin Kotlin kecil di Fase 9 |
| 4 | Selisih angka laporan | Salah catat akuntansi | Uji paritas per laporan di Fase 8–9 |
| 5 | Cold start Render | Request gagal palsu | Timeout 45 dtk dipertahankan |
| 6 | Tanpa PC lokal | Debug lambat | CI sebagai satu-satunya validator, log lewat layar CrashLog |
| 7 | Kontrak Periods sering berubah | Bug di Fase 6 | Verifikasi ke backend live sebelum coding |

## 7. Di Luar Cakupan
- iOS, Play Store, perubahan skema database, fitur Guardian, sinkronisasi offline (`SyncManager` tetap placeholder).
