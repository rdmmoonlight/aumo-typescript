# 6. Go Authentication Service (Cookie for Web, JWT for Mobile)

* Status: Accepted
* Date: 2026-10-19

## Context
Aplikasi membutuhkan layanan otentikasi performa tinggi berbasis Go yang mendukung dua tipe klien berbeda: Web (Next.js/Analog) dan Mobile (Android Kotlin).

## Decision
1. Layanan otentikasi dibangun menggunakan **Go 1.22**.
2. **Klien Web**: Menggunakan **HTTP-Only, Secure, dan SameSite Cookie** untuk mencegah serangan XSS.
3. **Klien Mobile**: Menggunakan **JWT Access Token** yang dikirimkan melalui header `Authorization: Bearer <token>`.
4. Endpoint `/auth/validate` mendukung pengecekan kredensial dari Cookie maupun Header Bearer secara otomatis.

## Consequences
- Klien Web tidak perlu menyimpan token secara manual di LocalStorage.
- Klien Mobile Kotlin wajib menyimpan JWT di *EncryptedSharedPreferences* atau *DataStore*.
