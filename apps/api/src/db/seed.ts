import 'dotenv/config';
import postgres from 'postgres';
import * as argon2 from 'argon2';

const DATABASE_URL = process.env['DATABASE_URL'] ?? 'postgresql://plowdispatch:plowdispatch@localhost:5432/plowdispatch';
const sql = postgres(DATABASE_URL);

const ADMIN_EMAIL = 'admin@plowdispatch.local';
const ADMIN_PASSWORD = 'AdminPass123!';

async function seed() {
  console.log('Seeding admin user...');
  const passwordHash = await argon2.hash(ADMIN_PASSWORD, { type: argon2.argon2id });
  await sql`
    INSERT INTO users (email, password_hash, role, full_name)
    VALUES (${ADMIN_EMAIL}, ${passwordHash}, 'admin', 'Admin')
    ON CONFLICT (email) DO NOTHING
  `;

  console.log('Seeding driver profile for admin...');
  await sql`
    INSERT INTO driver_profiles (user_id, status)
    SELECT id, 'available' FROM users WHERE email = ${ADMIN_EMAIL}
    ON CONFLICT DO NOTHING
  `;

  console.log('Seeding pricing_config...');
  await sql`
    INSERT INTO pricing_config (tier_label, price_cents, sort_order, is_active)
    VALUES
      ('1-Car Driveway', 6500, 1, true),
      ('2-Car Driveway', 8500, 2, true),
      ('3-Car Driveway', 10500, 3, true),
      ('4-Car Driveway', 12500, 4, true),
      ('5-Car Driveway', 14500, 5, true),
      ('6-Car Driveway', 16500, 6, true)
    ON CONFLICT DO NOTHING
  `;

  console.log('Seeding cancellation_rules...');
  // hours_before_threshold is the LOWER BOUND of each charging window.
  // Algorithm: sort descending, apply first rule where hoursUntil >= threshold.
  await sql`
    INSERT INTO cancellation_rules (job_type, hours_before_threshold, charge_percent, description)
    VALUES
      ('scheduled', 12, 0,  'Cancel >12 hours before: free'),
      ('scheduled', 6,  25, 'Cancel 6-12 hours before: 25% charge'),
      ('scheduled', 0,  50, 'Cancel <6 hours before: 50% charge'),
      ('asap', NULL, 0,  'Cancel before driver en-route: free'),
      ('asap', NULL, 25, 'Cancel after driver en-route: 25% charge')
    ON CONFLICT DO NOTHING
  `;

  console.log('Seed complete.');
  await sql.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
