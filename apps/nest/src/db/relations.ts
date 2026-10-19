import { relations } from 'drizzle-orm';
import * as schema from './schema/index.js';

export const userRelations = relations(schema.user, ({ many }) => ({
  sessions: many(schema.session),
  accounts: many(schema.account),
}));

export const sessionRelations = relations(schema.session, ({ one }) => ({
  user: one(schema.user, {
    fields: [schema.session.userId],
    references: [schema.user.id],
  }),
}));

export const accountRelations = relations(schema.account, ({ one }) => ({
  user: one(schema.user, {
    fields: [schema.account.userId],
    references: [schema.user.id],
  }),
}));
