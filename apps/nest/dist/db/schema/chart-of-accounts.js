import { boolean, integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';
export const chartOfAccounts = pgTable('chart-of-accounts', {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    referenceNumber: integer('reference_number').notNull(),
    accountName: varchar('account_name', { length: 100 }).notNull(),
    type: text().notNull(),
    role: text().notNull(),
    isActive: boolean('is_active').notNull(),
    userId: text('user_id').notNull(),
});
//# sourceMappingURL=chart-of-accounts.js.map