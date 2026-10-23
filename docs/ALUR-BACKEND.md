Berikut adalah alur sistematis (*workflow*) yang bisa Anda ikuti saat siap memulai pengerjaan backend di monorepo ini:

---

### Alur Pengerjaan Backend

```
1. Skema & Kontrak (Zod) ──> 2. Implementasi Service/API ──> 3. Integrasi Logger & Validation ──> 4. Test & CI Check

```

#### Step 1: Definisikan Kontrak Data (`libs/contracts`)

Langkah pertama selalu dimulai dari **kontrak data** sebagai *single source of truth* untuk semua service dan client.

1. Buka/buat file skema Zod di `libs/contracts/src/`.
2. Tentukan skema request, response, dan entitas.
3. Export tipe TypeScript dari skema tersebut.

```ts
// Example: libs/contracts/src/payment.ts
import { z } from 'zod';

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive(),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED']),
});

export type Payment = z.infer<typeof PaymentSchema>;

```

---

#### Step 2: Pilih & Buat Service Backend

Pilih *tech stack* backend yang sesuai dengan kebutuhan fitur:

* **NestJS (`apps/nest`):** Untuk fitur API umum atau integrasi cepat.
* **Go Service (`services/auth` atau `services/<nama-service>`):** Untuk service berkinerja tinggi, concurrency tinggi, atau otentikasi.
* **.NET / C# (`dotnet/`):** Untuk arsitektur enterprise atau modul transaksi keuangan/ledger.
* **Rust (`native/`):** Untuk *core engine* algoritma/komputasi berat.

*Tips:* Gunakan CLI generator jika membuat library baru:

```bash
pnpm run generate

```

---

#### Step 3: Terapkan Standar Logging & Keamanan

1. **Logging:** Gunakan **Pino** (untuk Node.js) atau modul logging standar masing-masing bahasa. Jangan gunakan `console.log`.
2. **Otentikasi:**

* Jalankan Go Auth Service (`pnpm run auth:dev`).
* **Web:** Gunakan HTTP-only Cookie (`auth_session`).
* **Mobile/Client:** Sertakan Bearer Token di header `Authorization`.

---

#### Step 4: Buat Integration Test

Tulis pengujian menggunakan **Vitest + Supertest** (Node.js) atau pengujian bawaan bahasa target (Go `go test`, .NET `dotnet test`, Rust `cargo test`).

---

#### Step 5: Eksekusi Local Check & Changeset

Sebelum melakukan commit, pastikan seluruh *pipeline* lokal aman:

```bash
# 1. Jalankan semua validator
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build

# 2. Buat catatan rilis jika ada perubahan fitur/kontrak
pnpm exec changeset

```

---

#### Step 6: Push & Polyglot CI Verification

Setiap *Pull Request* ke branch `main` akan diproses oleh **Polyglot CI Pipeline** untuk memastikan:

* Skema Zod/TypeScript tidak melanggar tipe data di .NET, Go, Rust, atau Kotlin.
* Roslyn Analyzers (.NET) & ESLint (TS) lulus tanpa warning/error.
* Seluruh unit & integration test lulus.
