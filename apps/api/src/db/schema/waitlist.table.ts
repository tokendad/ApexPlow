import { pgTable, uuid, text, numeric, integer, timestamp } from 'drizzle-orm/pg-core';
import { customerProfiles } from './customer-profiles.table';
import { serviceLocations } from './service-locations.table';
import { jobs } from './jobs.table';
import { pricingConfig } from './pricing-config.table';

export const waitlist = pgTable('waitlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customerProfiles.id),
  locationId: uuid('location_id').references(() => serviceLocations.id),
  drivewayTierId: integer('driveway_tier_id').references(() => pricingConfig.id),

  jobAddress: text('job_address').notNull(),
  jobLat: numeric('job_lat', { precision: 10, scale: 7 }).notNull(),
  jobLng: numeric('job_lng', { precision: 10, scale: 7 }).notNull(),

  notes: text('notes'),
  preferredContact: text('preferred_contact').$type<'sms' | 'email' | 'both' | 'none'>(),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),

  status: text('status').notNull().default('waiting').$type<'waiting' | 'promoted' | 'expired' | 'cancelled'>(),
  promotedJobId: uuid('promoted_job_id').references(() => jobs.id),
  promotedAt: timestamp('promoted_at', { withTimezone: true }),

  organizationId: uuid('organization_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
