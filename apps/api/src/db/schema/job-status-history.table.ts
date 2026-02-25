import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { jobs } from './jobs.table';
import { users } from './users.table';

export const jobStatusHistory = pgTable('job_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => jobs.id),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  changedByUserId: uuid('changed_by_user_id').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
