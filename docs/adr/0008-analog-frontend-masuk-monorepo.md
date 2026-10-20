(status *Proposed*)

- Bekukan perubahan baru di `/analog`
- prefix API `/api`
- Analog tetap SPA statis
- `.claude/skills` dan kunci `skills`/`permissions` dibuang
- `VITE_API_URL` dibaca **saat build**, bukan runtime
- /analog di repo lama sudah dihapus secara sadar dan suka rela

```
Browser ──► Nginx ($PORT)
              ├─ /              → file statis Analog (SPA, fallback /index.html)
              ├─ /health        → Nest (publik, untuk Render)
              ├─ /api/auth/*    → Go auth  (127.0.0.1:8080, prefix dipotong)
              ├─ /api/health, /api/reference, /api/openapi.json → Nest (publik)
              └─ /api/*         → auth_request → Go /auth/validate → Nest (127.0.0.1:5000)
```

**Aturan pemotongan prefix Nginx:** `proxy_pass` yang memiliki bagian URI memotong prefix lokasi yang cocok.

```nginx
location ^~ /api/auth/ { proxy_pass http://127.0.0.1:8080/auth/; }

location ^~ /api/ {
    auth_request /_validate;
    auth_request_set $auth_user_id $upstream_http_x_user_id;
    error_page 401 = @unauthorized;
    proxy_set_header X-User-Id $auth_user_id;
    proxy_pass http://127.0.0.1:5000/;
}

location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
}
```

Catatan: sketsa di atas belum memuat rute publik (`/api/health`, `/api/reference`, `/api/openapi.json`), pengecualian preflight, dan penimpaan `X-User-Id` kosong. Semua itu **wajib** dipertahankan dari `nginx.conf` yang ada saat Fase 7.

**Pembanding (tidak dipilih):** *Static Site* Render terpisah. Lebih hemat instance, tetapi berbeda situs dari API, sehingga cookie `SameSite=Lax` tidak terkirim. Dapat dipakai hanya bila Go auth diubah ke `SameSite=None; Secure` dan CORS Go diperluas (kini hanya `GET, POST, OPTIONS`). Itu mengubah keamanan layanan auth, jadi butuh ADR sendiri.
