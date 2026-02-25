import { pgTable, uuid, text, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { customerProfiles } from './customer-profiles.table';

export const serviceLocations = pgTable('service_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customerProfiles.id),
  label: text('label').notNull().default('Home'),
  addressLine1: text('address_line1').notNull(),
  addressLine2: text('address_line2'),
  city: text('city').notNull(),
  stateProvince: text('state_province').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull().default('US'),
  lat: numeric('lat', { precision: 10, scale: 7 }).notNull(),
  lng: numeric('lng', { precision: 10, scale: 7 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  organizationId: uuid('organization_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
