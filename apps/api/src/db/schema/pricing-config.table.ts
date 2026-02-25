import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const pricingConfig = pgTable('pricing_config', {
  id: serial('id').primaryKey(),
  tierLabel: text('tier_label').notNull(),
  priceCents: integer('price_cents').notNull(),
  sortOrder: integer('sort_order').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
