# 4. Polyglot Stack Integration & Contract Validation

* Status: Accepted
* Date: 2026-10-19

## Context
Proyek ini mengombinasikan beberapa modul teknis: Rust untuk performa tinggi, .NET backend service, Android Kotlin client, serta TypeScript Node.js/pnpm workspace.

## Decision
1. **Rust**: Dikelola melalui Cargo Workspace di dalam direktori `native/`.
2. **.NET**: Menggunakan Roslyn Analyzers (`StyleCop.Analyzers`) dengan `TreatWarningsAsErrors=true` untuk menjamin kualitas kode.
3. **Android**: Menggunakan Kotlin dengan target Java 17 dan `kotlinx.serialization`.
4. **Validasi Kontrak**: Pipeline CI menjalankan kompilasi dan pengujian skema data di seluruh bahasa (TypeScript, Rust, C#, Kotlin) untuk mencegah inkonsistensi field secara *compile-time*.

## Consequences
- PR yang mengubah skema data wajib memperbarui DTO/Contract di seluruh modul bahasa target agar CI lulus.
