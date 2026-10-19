import {
  pgTable,
  integer,
  varchar,
  text,
  boolean,
  uuid,
  timestamp,
  numeric,
  index,
  unique,
  foreignKey,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

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

export const verification = pgTable(
  'verification',
  {
    id: text().primaryKey().notNull(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index('verification_identifier_idx').using(
      'btree',
      table.identifier.asc().nullsLast().op('text_ops')
    ),
  ]
);

export const user = pgTable(
  'user',
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [unique('user_email_unique').on(table.email)]
);

export const account = pgTable(
  'account',
  {
    id: text().primaryKey().notNull(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { mode: 'string' }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { mode: 'string' }),
    scope: text(),
    password: text(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
  },
  (table) => [
    index('account_userId_idx').using('btree', table.userId.asc().nullsLast().op('text_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'account_user_id_user_id_fk',
    }).onDelete('cascade'),
  ]
);

export const session = pgTable(
  'session',
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
    token: text().notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull(),
  },
  (table) => [
    index('session_userId_idx').using('btree', table.userId.asc().nullsLast().op('text_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'session_user_id_user_id_fk',
    }).onDelete('cascade'),
    unique('session_token_unique').on(table.token),
  ]
);

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
