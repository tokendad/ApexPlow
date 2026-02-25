import { pgTable, uuid, integer, timestamp } from 'drizzle-orm/pg-core';
import { jobs } from './jobs.table';
import { users } from './users.table';

// No reason/note field in Phase 1. Phase 2 will add a reason column.
export const jobPriceChanges = pgTable('job_price_changes', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => jobs.id),
  changedByUserId: uuid('changed_by_user_id').notNull().references(() => users.id),
  oldPriceCents: integer('old_price_cents').notNull(),
  newPriceCents: integer('new_price_cents').notNull(),
  changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
});
