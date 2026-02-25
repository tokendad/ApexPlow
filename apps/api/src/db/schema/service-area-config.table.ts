import { pgTable, uuid, text, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';

export const serviceAreaConfig = pgTable('service_area_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  homeBaseAddress: text('home_base_address').notNull(),
  centerLat: numeric('center_lat', { precision: 10, scale: 7 }).notNull(),
  centerLng: numeric('center_lng', { precision: 10, scale: 7 }).notNull(),
  radiusMiles: numeric('radius_miles', { precision: 5, scale: 2 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  organizationId: uuid('organization_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
