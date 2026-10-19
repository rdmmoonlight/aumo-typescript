import { integer, numeric, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
export const generalJournal = pgTable('general-journal', {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    entryId: integer('entry_id'),
    journalType: varchar('journal_type', { length: 50 }).notNull(),
    entryDate: timestamp('entry_date', { withTimezone: true, mode: 'string' }).notNull(),
    transactionNumber: varchar('transaction_number', { length: 30 }).notNull(),
    description: text(),
    status: text(),
    accountId: integer('account_id'),
    accountNumber: integer('account_number'),
    debit: numeric({ precision: 15, scale: 2 }).default('0'),
    credit: numeric({ precision: 15, scale: 2 }).default('0'),
    userId: text('user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
});
//# sourceMappingURL=general-journal.js.map