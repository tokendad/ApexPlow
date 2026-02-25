import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.table';

export const driverProfiles = pgTable('driver_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  status: text('status').notNull().default('offline').$type<'offline' | 'available' | 'en_route' | 'on_job' | 'break'>(),
  vehicleType: text('vehicle_type'),
  vehicleMake: text('vehicle_make'),
  vehicleModel: text('vehicle_model'),
  vehicleYear: numeric('vehicle_year', { precision: 4, scale: 0 }),
  licensePlate: text('license_plate'),
  currentLat: numeric('current_lat', { precision: 10, scale: 7 }),
  currentLng: numeric('current_lng', { precision: 10, scale: 7 }),
  locationUpdatedAt: timestamp('location_updated_at', { withTimezone: true }),
  paypalLink: text('paypal_link'),
  venmoLink: text('venmo_link'),
  ratingAvg: numeric('rating_avg', { precision: 3, scale: 2 }),
  ratingCount: numeric('rating_count', { precision: 6, scale: 0 }).notNull().default('0'),
  organizationId: uuid('organization_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
