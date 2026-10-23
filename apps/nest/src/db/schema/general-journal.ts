import { index, integer, numeric, pgSequence, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { chartOfAccounts } from './chart-of-accounts.js';

/** Setara sequence GeneralJournal_JournalEntryId_seq: satu id per kelompok jurnal. */
export const journalEntryIdSeq = pgSequence('general_journal_journal_entry_id_seq', { startWith: 1 });

/** Setara GeneralJournal (EF): satu baris per baris jurnal; JournalEntryId mengelompokkan satu transaksi. */
export const generalJournal = pgTable(
    'general_journal',
    {
        lineId: integer().primaryKey().generatedByDefaultAsIdentity(),
        accountId: integer()
            .notNull()
            .references(() => chartOfAccounts.id, { onDelete: 'restrict' }),
        lineDescription: varchar({ length: 250 }),
        debit: numeric({ precision: 18, scale: 2, mode: 'string' }).notNull().default('0'),
        credit: numeric({ precision: 18, scale: 2, mode: 'string' }).notNull().default('0'),
        lineOrder: integer().notNull().default(0),
        journalEntryId: integer().notNull(),
        journalType: varchar({ length: 50 }).notNull(),
        entryDate: timestamp({ withTimezone: true }).notNull(),
        transactionNumber: varchar({ length: 30 }).notNull(),
        userId: text().notNull(),
        status: text(),
        createdAt: timestamp({ withTimezone: true }).notNull(),
        updatedAt: timestamp({ withTimezone: true }),
    },
    (t) => [
        index('ix_general_journal_account_id').on(t.accountId),
        index('ix_general_journal_journal_entry_id').on(t.journalEntryId),
        index('ix_general_journal_user_id_entry_date').on(t.userId, t.entryDate),
        index('ix_general_journal_user_id_transaction_number').on(t.userId, t.transactionNumber),
    ],
);
