import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/** Setara Periods (EF). Hanya satu periode terpilih per pengguna (indeks unik parsial). */
export const periods = pgTable(
    'periods',
    {
        id: integer().primaryKey().generatedByDefaultAsIdentity(),
        periodName: varchar({ length: 50 }).notNull(),
        startDate: timestamp({ withTimezone: true }).notNull(),
        endDate: timestamp({ withTimezone: true }).notNull(),
        isClosed: boolean().notNull().default(false),
        isSelected: boolean().notNull().default(false),
        userId: text().notNull(),
    },
    (t) => [
        index('ix_periods_user_id').on(t.userId),
        uniqueIndex('ix_periods_is_selected_unique').on(t.userId).where(sql`${t.isSelected} = true`),
    ],
);
