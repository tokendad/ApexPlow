import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { pricingConfig } from '../../db/schema/index';

const pricingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/v1/pricing/tiers', async (_request, reply) => {
    const tiers = await fastify.db.select().from(pricingConfig).where(eq(pricingConfig.isActive, true)).orderBy(pricingConfig.sortOrder);
    return reply.send({ success: true, data: tiers });
  });
};

export default pricingRoutes;
