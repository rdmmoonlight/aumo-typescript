import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

export const chartOfAccounts = pgTable('chart-of-accounts', {
  id: integer().primaryKey().notNull(),
  referenceNumber: integer('reference_number').notNull(),
  accountName: varchar('account_name', { length: 100 }).notNull(),
  type: text().notNull(),
  role: text().notNull(),
  isActive: boolean('is_active').notNull(),
  userId: uuid('user_id').notNull(),
});

export const generalJournal = pgTable('general-journal', {
  id: integer().primaryKey().notNull(),
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
  userId: uuid('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
});

export const transactionCounters = pgTable('transaction-counters', {
  id: integer().primaryKey().notNull(),
  userId: uuid('user_id').notNull(),
  counterKey: varchar('counter_key', { length: 10 }).notNull(),
  lastSequence: integer('last_sequence').notNull(),
});

export const periods = pgTable(
  'periods',
  {
    id: integer('Id').primaryKey().generatedByDefaultAsIdentity({
      name: 'Periods_Id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
    }),
    periodName: varchar('PeriodName', { length: 50 }).notNull(),
    startDate: timestamp('StartDate', { withTimezone: true, mode: 'string' }).notNull(),
    endDate: timestamp('EndDate', { withTimezone: true, mode: 'string' }).notNull(),
    isClosed: boolean('IsClosed').default(false).notNull(),
    isSelected: boolean('IsSelected').default(false).notNull(),
    userId: uuid('UserId').notNull(),
  },
  (table) => [
    uniqueIndex('IX_Periods_IsSelected_Unique')
      .using('btree', table.userId.asc().nullsLast().op('uuid_ops'))
      .where(sql`("IsSelected" = true)`),
    index('IX_Periods_UserId').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
  ]
);
