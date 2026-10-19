# Panduan Kontribusi (Contributing Guide)

Terima kasih telah berkontribusi pada workspace ini! Harap ikuti alur kerja berikut untuk menjaga standar kualitas kode.

## 🛠️ Persyaratan Lingkungan Pengembangan

- **Node.js**: `>=24.0.0`
- **pnpm**: `>=12.14.0`
- **Rust Toolchain**: `stable` (untuk modul Rust)
- **.NET SDK**: `10.0` (untuk modul .NET)

## 🚀 Alur Kerja Pembuatan Fitur

1. Jalankan `pnpm run generate` jika ingin membuat library baru dari template.
2. Pastikan membuat branch sesuai konvensi: `feat/nama-fitur` atau `fix/nama-bug`.
3. Sebelum mengirimkan Pull Request, pastikan seluruh pengujian lokal lulus:
   pnpm run lint
   pnpm run typecheck
   pnpm run test
   pnpm run build
4. Tambahkan catatan changeset jika PR menyertakan perubahan bermakna:
   pnpm exec changeset

## 📐 Konvensi Commit

Gunakan format Conventional Commits:
feat: Penambahan fitur baru.
fix: Perbaikan bug.
docs: Perubahan dokumentasi.
chore: Pemeliharaan build/CI/dependensi.
