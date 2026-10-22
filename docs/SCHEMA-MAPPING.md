# Catatan Pemetaan Skema Real Neon (Fase 5)

Dokumen ini memuat hasil ekstraksi skema aktual dari `information_schema.columns` di Neon DB dan aturan pemetaannya ke EF Core.

## 1. Ringkasan Pemetaan Tabel & Tipe UserId

| Nama Tabel (`information_schema`) | Gaya Penamaan Kolom | Tipe Kolom `user_id` | Mapped Entity C# | Primary Key |
| --- | --- | --- | --- | --- |
| `chart-of-accounts` | `snake_case` | `uuid` | `ChartOfAccount` | `id` (int) |
| `general-journal` | `snake_case` | `uuid` | `GeneralJournal` | `id` (int) |
| `periods` | `snake_case` | `text` | `Period` | `id` (int) |
| `selected_periods` | `snake_case` | `character varying` | `SelectedPeriod` | (`user_id`, `period_id`) |
| `source_periods` | `PascalCase` | `uuid` | `SourcePeriod` | `Id` (int) |
| `transaction-counters` | `snake_case` | `uuid` | `TransactionCounter` | `id` (int) |

---

## 2. Aturan Handling Tipe Data `UserId` (C# Guid)

Seluruh entitas C# menggunakan tipe `Guid` untuk properti `UserId`. EF Core mengonversinya menggunakan `ValueConverter<Guid, string>` dengan pemetaan tipe DB sesuai skema di atas:

- **`uuid`**: `chart-of-accounts`, `general-journal`, `source_periods`, `transaction-counters`
- **`text`**: `periods`
- **`character varying`**: `selected_periods`

---

## 3. Kebijakan Migrasi & Eksekusi

1. **Schema Authority**: Drizzle ORM (NestJS).
2. **EF Core**:
   - `Database.MigrateAsync()` **dihapus**.
   - Folder `Migrations/` **dihapus**.
   - Hanya melakukan pemetaan baca/tulis (*read/write*) via Fluent API.
3. **Eksekusi DDL**: Seluruh perubahan DDL dilakukan manual melalui Drizzle CLI ke Neon PostgreSQL.
