import { boolean, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const notifications = pgTable('notifications', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    targetUrl: text('target_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});