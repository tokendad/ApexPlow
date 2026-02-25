import 'dotenv/config';

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

console.log('PlowDispatch Worker starting...');
console.log('Database:', DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
console.log('Worker ready. Handlers will be registered in Milestone 1.4.');

// pg-boss will be initialized here in Milestone 1.4
// when notification dispatch jobs are implemented
