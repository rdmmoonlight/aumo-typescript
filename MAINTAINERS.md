# Panduan Maintainer (Maintainer Guide)

Panduan ini ditujukan bagi pengelola repository untuk proses *code review*, *release*, dan tata kelola *dependency*.

## 📦 Proses Release Automation
1. Setiap PR yang di-*merge* ke branch `main` dengan Changeset akan memicu GitHub Actions **Release Automation**.
2. Workflow akan membuat Pull Request gabungan bertajuk `"Version Packages"`.
3. Saat PR `"Version Packages"` di-*merge*, versi seluruh paket akan diperbarui dan changelog akan dibuat secara otomatis.

## 🔒 Tata Kelola Dependensi & Keamanan
- Pembaruan dependensi otomatis dikelola oleh **Renovate Bot**.
- Dependensi `patch` dan `minor` untuk rilis stabil akan di-*automerge* jika seluruh tes CI lulus.
- Pembaruan dependensi `major` memerlukan persetujuan manual sekurang-kurangnya dari 1 maintainer.

## 🏛️ Mengajukan Perubahan Arsitektur
Semua keputusan teknis berskala besar (seperti penambahan bahasa baru, penggantian *framework*, atau perubahan strategi database) **wajib** dibuatkan ADR baru di `docs/adr/00xx-nama-keputusan.md`.
