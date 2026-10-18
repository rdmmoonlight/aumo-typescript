# 5. Automated Releases and Dependency Governance

* Status: Accepted
* Date: 2026-10-19

## Context
Seiring berkembangnya modul polyglot dan multi-paket pada monorepo ini, diperlukan proses rilis yang konsisten serta pemantauan dependensi secara otomatis.

## Decision
1. Menggunakan **Changesets** untuk otomatisasi versi dan penerbitan *changelog*.
2. Menggunakan **Plop.js** untuk konsistensi scaffolding pustaka baru.
3. Menggunakan **Renovate** untuk otomatisasi pembaruan dependensi dan *patch* keamanan.

## Consequences
- Setiap PR fitur/bugfix wajib melampirkan file changeset agar tercatat pada rilis berikutnya.
