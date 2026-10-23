import { boolean, integer, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

/** Setara ChartOfAccounts (EF). Tipe dan peran akun disimpan sebagai teks seperti di sumber. */
export const chartOfAccounts = pgTable(
    'chart_of_accounts',
    {
        id: integer().primaryKey().generatedByDefaultAsIdentity(),
        referenceNumber: integer().notNull(),
        accountName: varchar({ length: 100 }).notNull(),
        type: text().notNull(),
        role: text().notNull(),
        isActive: boolean().notNull(),
        userId: text().notNull(),
    },
    (t) => [uniqueIndex('ix_chart_of_accounts_user_id_reference_number').on(t.userId, t.referenceNumber)],
);
