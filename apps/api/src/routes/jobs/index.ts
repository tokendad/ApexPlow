import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { jobs, serviceAreaConfig, pricingConfig, customerProfiles } from '../../db/schema/index';
import { isWithinServiceArea, assertValidTransition } from '@plowdispatch/utils';
import { requireRole } from '../../middleware/require-role';
import type { JobStatus } from '@plowdispatch/types';

const createJobSchema = z.object({
  jobAddress: z.string().min(1),
  jobLat: z.number(),
  jobLng: z.number(),
  drivewayTierId: z.number().int().min(1),
  jobType: z.enum(['asap', 'scheduled']),
  scheduledFor: z.string().datetime().optional(),
  specialInstructions: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  preferredContact: z.enum(['sms', 'email', 'both', 'none']).optional(),
});

const jobRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/v1/jobs', { preHandler: [requireRole('customer', 'admin')] }, async (request, reply) => {
    const body = createJobSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: body.error.flatten().fieldErrors } });
    }

    // Service area check
    const [area] = await fastify.db.select().from(serviceAreaConfig).where(eq(serviceAreaConfig.isActive, true)).limit(1);
    if (area) {
      const within = isWithinServiceArea(body.data.jobLat, body.data.jobLng, Number(area.centerLat), Number(area.centerLng), Number(area.radiusMiles));
      if (!within) {
        return reply.status(422).send({ success: false, error: { code: 'OUTSIDE_SERVICE_AREA', message: 'The requested address is outside our service area.' } });
      }
    }

    // Get tier price
    const [tier] = await fastify.db.select().from(pricingConfig).where(eq(pricingConfig.id, body.data.drivewayTierId)).limit(1);
    if (!tier) {
      return reply.status(400).send({ success: false, error: { code: 'INVALID_TIER', message: 'Invalid driveway tier' } });
    }

    const payload = request.user as { sub: string; role: string };
    const [customer] = await fastify.db.select().from(customerProfiles).where(eq(customerProfiles.userId, payload.sub)).limit(1);
    if (!customer) {
      return reply.status(422).send({ success: false, error: { code: 'NO_CUSTOMER_PROFILE', message: 'No customer profile found for this user. Admin manual job creation is handled by the admin endpoint.' } });
    }

    const [job] = await fastify.db.insert(jobs).values({
      customerId: customer.id,
      jobAddress: body.data.jobAddress,
      jobLat: String(body.data.jobLat),
      jobLng: String(body.data.jobLng),
      drivewayTierId: body.data.drivewayTierId,
      jobType: body.data.jobType,
      scheduledFor: body.data.scheduledFor ? new Date(body.data.scheduledFor) : null,
      specialInstructions: body.data.specialInstructions ?? null,
      quotedPriceCents: tier.priceCents,
      source: payload.role === 'admin' ? 'admin' : 'customer',
      serviceType: 'residential',
    }).returning();

    return reply.status(201).send({ success: true, data: job });
  });

  fastify.get('/api/v1/jobs', { preHandler: [requireRole('admin', 'driver')] }, async (_request, reply) => {
    const allJobs = await fastify.db.select().from(jobs).orderBy(jobs.createdAt);
    return reply.send({ success: true, data: allJobs });
  });

  fastify.get('/api/v1/jobs/:id', { preHandler: [requireRole('customer', 'driver', 'admin')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [job] = await fastify.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!job) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } });
    return reply.send({ success: true, data: job });
  });

  fastify.patch('/api/v1/jobs/:id/status', { preHandler: [requireRole('driver', 'admin')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z.object({ status: z.string() }).safeParse(request.body);
    if (!body.success) return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Status required' } });

    const [job] = await fastify.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!job) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } });

    try {
      assertValidTransition(job.status as JobStatus, body.data.status as JobStatus);
    } catch {
      return reply.status(400).send({ success: false, error: { code: 'INVALID_STATUS_TRANSITION', message: `Cannot transition from ${job.status} to ${body.data.status}` } });
    }

    const now = new Date();

    const [updated] = await fastify.db.update(jobs).set({
      status: body.data.status as JobStatus,
      updatedAt: now,
      ...(body.data.status === 'assigned' ? { assignedAt: now } : {}),
      ...(body.data.status === 'arrived' ? { arrivedAt: now } : {}),
      ...(body.data.status === 'in_progress' ? { startedAt: now } : {}),
      ...(body.data.status === 'completed' ? { completedAt: now } : {}),
      ...(body.data.status === 'cancelled' ? { cancelledAt: now } : {}),
    }).where(eq(jobs.id, id)).returning();

    return reply.send({ success: true, data: updated });
  });
};

export default jobRoutes;
