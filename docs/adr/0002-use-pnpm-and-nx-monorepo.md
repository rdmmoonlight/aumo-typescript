# 2. Use pnpm Workspace and Nx

* Status: Accepted
* Date: 2026-10-19

## Context
Proyek ini membutuhkan pengelolaan monorepo yang efisien dalam manajemen dependensi dan build caching.

## Decision
Menggunakan `pnpm` workspace untuk dependency management dan `Nx` sebagai build system/task runner.

## Consequences
Pengembang wajib mendaftarkan aplikasi/pustaka baru di bawah folder `apps/` atau `libs/`.
