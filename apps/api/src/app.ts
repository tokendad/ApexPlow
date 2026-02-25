import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';

import dbPlugin from './plugins/db';
import redisPlugin from './plugins/redis';
import healthRoutes from './routes/health/index';
import authRoutes from './routes/auth/index';
import jobRoutes from './routes/jobs/index';
import pricingRoutes from './routes/pricing/index';
import adminRoutes from './routes/admin/index';

export async function buildApp() {
  const isDev = process.env['NODE_ENV'] !== 'production';
  const app = Fastify({
    logger: isDev
      ? { level: 'debug', transport: { target: 'pino-pretty' } }
      : { level: 'info' },
  });

  // Security
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: (process.env['CORS_ORIGINS'] ?? 'http://localhost:5173').split(','),
    credentials: true,
  });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  // Auth
  await app.register(cookie);
  await app.register(jwt, {
    secret: process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
  });

  // Utilities
  await app.register(sensible);

  // Data
  await app.register(dbPlugin);
  await app.register(redisPlugin);

  // Routes
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(jobRoutes);
  await app.register(pricingRoutes);
  await app.register(adminRoutes);

  return app;
}
