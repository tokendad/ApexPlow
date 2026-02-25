import { pgTable, bigserial, uuid, numeric, timestamp } from 'drizzle-orm/pg-core';
import { driverProfiles } from './driver-profiles.table';

// Stub table for Phase 2. Monthly partitioning and 90-day retention will be added in Phase 2.
export const driverLocationLog = pgTable('driver_location_log', {
  id: bigserial('id', { mode: 'bigint' }),
  driverId: uuid('driver_id').notNull().references(() => driverProfiles.id),
  lat: numeric('lat', { precision: 10, scale: 7 }).notNull(),
  lng: numeric('lng', { precision: 10, scale: 7 }).notNull(),
  accuracyM: numeric('accuracy_m', { precision: 8, scale: 2 }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
});
