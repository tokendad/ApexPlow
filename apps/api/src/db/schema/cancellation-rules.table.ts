import { pgTable, serial, text, numeric, integer, timestamp } from 'drizzle-orm/pg-core';

export const cancellationRules = pgTable('cancellation_rules', {
  id: serial('id').primaryKey(),
  jobType: text('job_type').notNull().$type<'asap' | 'scheduled'>(),
  hoursBeforeThreshold: numeric('hours_before_threshold', { precision: 5, scale: 2 }),
  chargePercent: integer('charge_percent').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
