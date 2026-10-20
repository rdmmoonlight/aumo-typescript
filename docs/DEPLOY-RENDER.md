# Deploy ke Render (Dockerfile root)

Satu service Docker (`aumo-api`) menjalankan tiga proses lewat supervisord:

| Proses | Port | Peran |
| --- | --- | --- |
| Nginx | `$PORT` (Render, default 10000) | Gerbang tunggal, satu-satunya port publik |
| Go auth (`services/auth`) | 8080 (internal) | Register, login, Google OAuth, penerbit JWT; pengguna disimpan di PostgreSQL |
| NestJS (`apps/nest`) | 5000 (internal) | Rute API dan dokumentasi Scalar |

## Alur auth

1. Klien memanggil `POST /auth/login` (`client: "web"` menghasilkan cookie `auth_session`; `client: "mobile"` menghasilkan `token` di body).
2. Untuk rute terlindungi, Nginx memanggil `GET /auth/validate` (auth_request). Token dibaca dari cookie atau `Authorization: Bearer`.
3. Bila sah, Go membalas header `X-User-Id`; Nginx meneruskannya ke Nest. Header `X-User-Id` dari klien selalu ditimpa atau dikosongkan, sehingga tidak dapat dipalsukan.
4. Bila tidak sah, klien menerima `401` JSON dan Nest tidak dipanggil.

Rute publik (tanpa token): `/`, `/health`, `/reference`, `/openapi.json`, dan seluruh `/auth/*`.

## Alamat dokumentasi (Scalar)

- `https://<nama-service>.onrender.com/reference`
- Spesifikasi: `https://<nama-service>.onrender.com/openapi.json`

## Variabel lingkungan (Render, menu Environment)

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `JWT_SECRET` | Ya | Minimal 32 karakter. `render.yaml` membuatnya otomatis |
| `DATABASE_URL` | Ya | URL Postgres (Neon). Dipakai Nest dan Go auth; tanpa ini keduanya berhenti saat start |
| `REDIS_URL` | Tidak | Untuk rate limit dan antrean |
| `FRONTEND_URL` | Tidak | Tujuan redirect setelah login Google (web) dan origin CORS |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Tidak | Kosong: login Google mengembalikan 503 |
| `GOOGLE_REDIRECT_URL` | Bila Google aktif | `https://<nama-service>.onrender.com/auth/google-callback`; daftarkan juga di Google Cloud Console |
| `COOKIE_SECURE` | Tidak | Default `true` di produksi |

## Catatan

- Go auth wajib memakai database. Saat start ia membuat skema `auth` dan tabel `auth.users` (idempoten), terpisah dari skema `public` milik Drizzle/Nest. Tanpa `DATABASE_URL` layanan berhenti dengan pesan galat.
- Tes penyimpanan Postgres berjalan bila `TEST_DATABASE_URL` diisi (CI menyediakannya lewat service Postgres).
- Uji lokal: `docker compose up --build`, lalu buka `http://localhost:10000/reference`.
