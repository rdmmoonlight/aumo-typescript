import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const periods = pgTable(
  'periods',
  {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity({
      name: 'periods_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
    }),
    periodName: varchar('period_name', { length: 50 }).notNull(),
    startDate: timestamp('start_date', { withTimezone: true, mode: 'string' }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true, mode: 'string' }).notNull(),
    isClosed: boolean('is_closed').default(false).notNull(),
    isSelected: boolean('is_selected').default(false).notNull(),
    userId: text('user_id').notNull(),
  },
  (table) => [
    uniqueIndex('ix_periods_is_selected_unique')
      .using('btree', table.userId.asc().nullsLast())
      .where(sql`(is_selected = true)`),
    index('ix_periods_user_id').using('btree', table.userId.asc().nullsLast()),
  ]
);

export const selectedPeriods = pgTable('selected_periods', {
  userId: varchar('user_id').primaryKey(),
  periodId: integer('period_id').notNull(),
  updatedAt: timestamp('updated_at'),
});