# 0011. `apps/next` menggantikan `apps/analog`, `apps/api` menjadi pintu tunggal `/api`

(status *Proposed*. Menjadi *Accepted* setelah Fase 10 di `docs/PETA-RUTE-NEXT-API.md` selesai. Menggantikan ADR 0008.)

## Konteks

- `apps/analog` (ADR 0008) dan `apps/next` ada bersamaan. `apps/next` sudah dibangun oleh `Dockerfile` dan disajikan oleh `nginx.conf`.
- Rute API dilayani tiga backend (Go, .NET, Nest) lewat `location` Nginx terpisah. `apps/api` hanya stub.
- Panggilan `apps/next` tidak seluruhnya cocok dengan rute backend (bagian 4 pada dokumen peta).

## Keputusan

1. `apps/next` menggantikan `apps/analog` secara total dan independen. Tidak ada pemetaan halaman. `apps/analog` dihapus di Fase 10.
2. Seluruh panggilan Next berawalan `/api` pada satu origin.
3. Isi `apps/nest` dipindah ke `apps/api` (`@app/api`). `apps/nest` tidak ada lagi.
4. `apps/api` menjadi satu-satunya upstream `/api/*`. Rute Go dan .NET diteruskan lewat proxy. Pemilik logika tidak berubah (ADR 0006, 0009, 0010).
5. Satu registri rute menjadi sumber kebenaran. Tes kontrak membandingkannya dengan panggilan Next.
6. Celah rute ditutup di backend, kecuali `guardian/*` yang UI-nya dihapus dari Next (ADR 0010 Keputusan 12 tetap berlaku).

## Alternatif yang Ditolak

| Alternatif | Alasan ditolak |
| --- | --- |
| Nginx tetap menjadi router per layanan | Rute baru selalu butuh ubah Nginx. Dua tempat mendefinisikan rute |
| Hanya mengganti nama `apps/nest` tanpa proxy | `apps/api` tidak menangani rute Go dan .NET, tidak memenuhi tujuan |
| Memindahkan logika Go dan .NET ke Nest | Bertentangan dengan ADR 0006 dan 0009 |

## Akibat

**Positif:** satu pintu API, satu dokumentasi Scalar, Nginx lebih sederhana, tanpa biaya tambahan.

**Negatif dan risiko:** satu lompatan proxy tambahan, `apps/api` menjadi titik tunggal. Mitigasi di bagian 7 dokumen peta.

## Rujukan

- `docs/PETA-RUTE-NEXT-API.md`
- ADR 0006, 0007, 0008, 0009, 0010
