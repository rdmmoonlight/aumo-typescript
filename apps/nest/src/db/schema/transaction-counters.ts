import { integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';

export const transactionCounters = pgTable('transaction-counters', {
  id: integer().primaryKey().notNull(),
  userId: text('user_id').notNull(),
  counterKey: varchar('counter_key', { length: 10 }).notNull(),
  lastSequence: integer('last_sequence').notNull(),
});
