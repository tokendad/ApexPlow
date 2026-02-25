import { pgTable, uuid, text, integer, numeric, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { customerProfiles } from './customer-profiles.table';
import { driverProfiles } from './driver-profiles.table';
import { serviceLocations } from './service-locations.table';
import { pricingConfig } from './pricing-config.table';

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customerProfiles.id),
  driverId: uuid('driver_id').references(() => driverProfiles.id),
  locationId: uuid('location_id').references(() => serviceLocations.id),
  drivewayTierId: integer('driveway_tier_id').references(() => pricingConfig.id),

  // Denormalized address snapshot
  jobAddress: text('job_address').notNull(),
  jobLat: numeric('job_lat', { precision: 10, scale: 7 }).notNull(),
  jobLng: numeric('job_lng', { precision: 10, scale: 7 }).notNull(),

  status: text('status').notNull().default('pending')
    .$type<'pending' | 'assigned' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'rejected' | 'waitlisted'>(),
  source: text('source').notNull().default('customer').$type<'customer' | 'admin'>(),
  serviceType: text('service_type').notNull().default('residential').$type<'residential' | 'commercial'>(),
  jobType: text('job_type').notNull().$type<'asap' | 'scheduled'>(),
  specialInstructions: text('special_instructions'),

  // Pricing
  quotedPriceCents: integer('quoted_price_cents').notNull(),
  finalPriceCents: integer('final_price_cents'),
  discountCents: integer('discount_cents').notNull().default(0),
  tipAmountCents: integer('tip_amount_cents'),       // Phase 2 — no UI in Phase 1

  // Cancellation
  cancellationReason: text('cancellation_reason'),
  cancellationChargeCents: integer('cancellation_charge_cents'),

  // Payment
  paymentMethod: text('payment_method').$type<'cash' | 'card' | 'paypal' | 'venmo' | 'other'>(),
  paymentAmountCents: integer('payment_amount_cents'),

  // Future stubs
  recurringSchedule: jsonb('recurring_schedule'),    // Phase 3 seasonal
  stripePaymentIntentId: text('stripe_payment_intent_id'), // Phase 2

  // Timestamps
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  arrivedAt: timestamp('arrived_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),

  organizationId: uuid('organization_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
