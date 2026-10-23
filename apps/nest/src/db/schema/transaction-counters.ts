import { integer, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

/** Setara TransactionCounters (EF). CounterKey = prefix + yyMM, mis. GJ2610. */
export const transactionCounters = pgTable(
    'transaction_counters',
    {
        id: integer().primaryKey().generatedByDefaultAsIdentity(),
        userId: text().notNull(),
        counterKey: varchar({ length: 10 }).notNull(),
        lastSequence: integer().notNull(),
    },
    (t) => [uniqueIndex('ix_transaction_counters_user_id_counter_key').on(t.userId, t.counterKey)],
);
