# CI/CD Pipeline Documentation

Pipeline ini berjalan otomatis pada event `push` dan `pull_request` ke branch `main`.

## Mekanisme Autofix & Commit Otomatis

1. **Auto-Fixing**:
   - Step `Run Autofix` menjalankan skrip perbaikan kode otomatis (`pnpm run lint --fix` dan/atau `pnpm run format`).
   - Jika ada perubahan format atau lint yang terisolasi, perubahan tersebut diserap secara otomatis.

2. **Auto-Commit**:
   - Menggunakan `stefanzweifel/git-auto-commit-action@v5` untuk melakukan commit dan push langsung ke branch pemicu.
   - Pesan commit default: `chore(ci): auto-fix lint and formatting issues [skip ci]`.
   - Menggunakan penanda `[skip ci]` agar commit perbaikan ini tidak memicu infinite loop CI.

## Penanganan Error yang Tidak Bisa Di-fix Otomatis

Tidak semua masalah kode dapat diperbaiki secara otomatis oleh Linter atau Formatter:

- **Manual ESLint Rules / Code Logic Errors**: Jika ada aturan lint yang memerlukan logika manual (misalnya variabel tidak terpakai, aturan aksesibelitas/a11y, *custom rule*), step **Check Remaining Lint Errors** akan gagal (`exit 1`) dan menghentikan proses pipeline.
- **Typecheck Failure**: Perbaikan tipe data TypeScript (`pnpm run typecheck`) **tidak dapat di-autofix** oleh linter. Pengembang harus memperbaiki tipe data secara manual di repositori lokal.
- **Test / Build Failure**: Kegagalan uji coba atau kompilasi build memerlukan investigasi serta kode perbaikan manual.

> **Catatan Developer**: Jika pipeline gagal pada step `Check Remaining Lint Errors` atau `Typecheck`, periksa log tindakan GitHub Actions, lakukan perbaikan manual di lingkungan lokal, lalu push kembali commit Anda.
