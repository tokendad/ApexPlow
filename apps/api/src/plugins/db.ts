import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema/index';

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle<typeof schema>>;
  }
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  const client = postgres(process.env['DATABASE_URL'] ?? '');
  const db = drizzle(client, { schema });
  fastify.decorate('db', db);
  fastify.addHook('onClose', async () => { await client.end(); });
};

export default fp(dbPlugin, { name: 'db' });
