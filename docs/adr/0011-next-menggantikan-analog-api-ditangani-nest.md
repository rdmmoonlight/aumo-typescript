# 0011. `apps/next` menggantikan `apps/analog`, `apps/api` dihapus

(status *Proposed*. Menjadi *Accepted* setelah Fase 8 di `docs/PETA-RUTE-NEXT.md` selesai. Menggantikan ADR 0008.)

## Konteks

- `apps/analog` (ADR 0008) dan `apps/next` ada bersamaan. `apps/next` sudah dibangun oleh `Dockerfile` dan disajikan oleh `nginx.conf`.
- `apps/api` hanya berisi tes tiruan, tanpa kode produksi. Seluruh rute Node sudah ditangani `apps/nest`.
- Panggilan `apps/next` tidak seluruhnya cocok dengan rute backend dan konfigurasi Nginx (bagian 4 pada dokumen peta).

## Keputusan

1. `apps/next` menggantikan `apps/analog` secara total dan independen. Tidak ada pemetaan halaman. `apps/analog` dihapus di Fase 7.
2. `apps/api` dihapus di Fase 1. `apps/nest` tetap satu-satunya API Node. Tes `CreateUserSchema` dipindah ke `libs/contracts`.
3. Seluruh panggilan Next berawalan `/api` pada satu origin.
4. Nginx tetap menjadi router per layanan. Pemilik logika tidak berubah (ADR 0006, 0009, 0010).
5. Rute Next diselaraskan ke backend. Backend hanya ditambah untuk celah (`trial-balances`, `settings/*`).
6. `guardian/*` tetap tidak diduplikasi (ADR 0010 Keputusan 12). UI-nya dihapus dari Next.
7. Tes kontrak rute di CI mencegah rute Next yang tidak terdaftar.

## Alternatif yang Ditolak

| Alternatif | Alasan ditolak |
| --- | --- |
| Mengisi `apps/api` sebagai pintu tunggal dengan proxy | Pemilik repo memutuskan menghapus `apps/api`. Menambah satu lompatan tanpa manfaat bagi Next |
| Memindahkan logika Go dan .NET ke Nest | Bertentangan dengan ADR 0006 dan 0009 |
| Memetakan halaman Analog ke Next | Keduanya tidak terkait. Next menggantikan total |

## Akibat

**Positif:** satu API Node, tanpa paket stub, rute Next sesuai backend, tanpa biaya tambahan.

**Negatif dan risiko:** tab keamanan (guardian) hilang dari Next. Mitigasi di bagian 7 dokumen peta.

## Rujukan

- `docs/PETA-RUTE-NEXT.md`
- ADR 0006, 0007, 0008, 0009, 0010
