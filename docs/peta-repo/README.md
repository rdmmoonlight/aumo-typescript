# Peta Repo (Indeks)

> Dibuat: 2026-10-23 · Diperbarui: 2026-10-23

Folder ini adalah pintu masuk tunggal bagi manusia dan AI untuk memahami repo `aumo-typescript`.

| Berkas | Isi | Baca bila |
| --- | --- | --- |
| [`IDENTITAS-REPO.md`](./IDENTITAS-REPO.md) | Identitas lengkap: pemilik, toolchain, paket, deploy, konvensi | Pertama kali membuka repo |
| [`PETA-APLIKASI.md`](./PETA-APLIKASI.md) | Denah komponen, port, rute Nginx, alur data, CI/CD | Perlu tahu cara kerja sistem |
| [`PETA-FILE.md`](./PETA-FILE.md) | Setiap berkas dengan tanggal dibuat dan diperbarui | Mencari lokasi atau umur sebuah berkas |
| [`PETA-DOKUMENTASI.md`](./PETA-DOKUMENTASI.md) | Arsip seluruh dokumen dan ADR beserta status | Mencari dokumentasi |

## Aturan

1. **Folder terkunci**: `dotnet/`, `apps/nest/`, `apps/next/` (under construction). Jangan diubah dan jangan dipetakan per berkas.
2. Tanggal pada peta bersumber dari riwayat Git, bukan dari waktu berkas di disk.
3. Setiap perubahan struktur repo wajib disertai pembaruan peta ini (tanggal "Diperbarui" dan basis commit).
4. Keputusan arsitektur baru dicatat di `docs/adr/`, lalu didaftarkan di `PETA-DOKUMENTASI.md`.

## Cara Menyegarkan Tanggal

```bash
git ls-files | while read f; do
  c=$(git log --diff-filter=A --follow --format=%as -- "$f" | tail -1)
  u=$(git log -1 --format=%as -- "$f")
  echo "$f | $c | $u"
done
```

Hasilnya dimasukkan ke kolom Dibuat dan Diperbarui pada `PETA-FILE.md`.
