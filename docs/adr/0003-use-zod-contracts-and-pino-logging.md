# 3. Use Zod for Contracts and Pino for Structured Logging

* Status: Accepted
* Date: 2026-10-19
Dihapus: 23/10/26

## Context

Aplikasi membutuhkan kontrak data yang konsisten antara server dan SDK client, serta logging terstruktur untuk kemudahan pemantauan (observability).

## Decision

1. Menggunakan Zod di pustaka `@app/contracts` sebagai single source of truth untuk skema dan tipe data.
2. Menggunakan Pino sebagai logger terstruktur dengan format JSON standar.
3. Menggunakan Supertest dan Vitest untuk pengujian integrasi endpoint API.

## Consequences

* Semua penambahan entitas API baru wajib menyertakan skema Zod di `@app/contracts`.

* Penggunaan `console.log` dilarang dan diatur via aturan ESLint; wajib menggunakan instance Pino logger.
