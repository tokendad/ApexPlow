import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, and, inArray, gte, sql } from 'drizzle-orm';
import {
  users,
  driverProfiles,
  customerProfiles,
  jobs,
  jobPriceChanges,
  jobStatusHistory,
  pricingConfig,
  serviceAreaConfig,
  waitlist,
} from '../../db/schema/index';
import { requireRole } from '../../middleware/require-role';
import { assertValidTransition } from '@plowdispatch/utils';
import type { JobStatus } from '@plowdispatch/types';

// ─── Zod schemas ────────────────────────────────────────────────────────────

const serviceAreaSchema = z.object({
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  radiusMiles: z.number().min(1).max(50),
});

const pricingUpdateSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    tierLabel: z.string().min(1),
    priceCents: z.number().int().positive(),
  }),
);

const paymentLinksSchema = z.object({
  paypalLink: z.string().url().nullable().optional(),
  venmoLink: z.string().url().nullable().optional(),
});

const manualJobSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  jobAddress: z.string().min(1),
  jobLat: z.number(),
  jobLng: z.number(),
  drivewayTierId: z.number().int().positive(),
  jobType: z.enum(['asap', 'scheduled']),
  scheduledFor: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const priceOverrideSchema = z.object({
  newPriceCents: z.number().int().positive(),
});

const paymentRecordSchema = z.object({
  paymentMethod: z.enum(['cash', 'card', 'paypal', 'venmo', 'other']),
  paymentAmountCents: z.number().int().min(0),
});

const statusTransitionSchema = z.object({
  status: z.string().min(1),
});

// ─── Helper: build job board row ────────────────────────────────────────────

const jobBoardSelect = {
  id: jobs.id,
  status: jobs.status,
  jobType: jobs.jobType,
  source: jobs.source,
  jobAddress: jobs.jobAddress,
  jobLat: jobs.jobLat,
  jobLng: jobs.jobLng,
  drivewayTierId: jobs.drivewayTierId,
  quotedPriceCents: jobs.quotedPriceCents,
  finalPriceCents: jobs.finalPriceCents,
  paymentMethod: jobs.paymentMethod,
  paymentAmountCents: jobs.paymentAmountCents,
  specialInstructions: jobs.specialInstructions,
  scheduledFor: jobs.scheduledFor,
  assignedAt: jobs.assignedAt,
  arrivedAt: jobs.arrivedAt,
  startedAt: jobs.startedAt,
  completedAt: jobs.completedAt,
  cancelledAt: jobs.cancelledAt,
  createdAt: jobs.createdAt,
  updatedAt: jobs.updatedAt,
  tierLabel: pricingConfig.tierLabel,
  customerName: users.fullName,
  customerPhone: users.phone,
  customerEmail: users.email,
};

// ─── Routes ─────────────────────────────────────────────────────────────────

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // All admin routes require admin role
  const preHandler = [requireRole('admin')];

  // ── Onboarding status ───────────────────────────────────────────────────

  fastify.get('/api/v1/admin/onboarding-status', { preHandler }, async (request, reply) => {
    const payload = request.user as { sub: string };

    const [area] = await fastify.db.select().from(serviceAreaConfig)
      .where(eq(serviceAreaConfig.isActive, true)).limit(1);

    const [pricingRow] = await fastify.db.select().from(pricingConfig)
      .where(eq(pricingConfig.isActive, true)).limit(1);

    const [driverProfile] = await fastify.db.select().from(driverProfiles)
      .where(eq(driverProfiles.userId, payload.sub)).limit(1);

    const hasPaymentLinks = !!(driverProfile?.paypalLink || driverProfile?.venmoLink);

    return reply.send({
      success: true,
      data: {
        serviceArea: !!area,
        pricing: !!pricingRow,
        paymentLinks: hasPaymentLinks,
        isComplete: !!area && !!pricingRow && hasPaymentLinks,
      },
    });
  });

  // ── Service area ────────────────────────────────────────────────────────

  fastify.get('/api/v1/admin/service-area', { preHandler }, async (_request, reply) => {
    const [area] = await fastify.db.select().from(serviceAreaConfig)
      .where(eq(serviceAreaConfig.isActive, true)).limit(1);
    return reply.send({ success: true, data: area ?? null });
  });

  fastify.put('/api/v1/admin/service-area', { preHandler }, async (request, reply) => {
    const body = serviceAreaSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: body.error.flatten().fieldErrors } });
    }

    // Deactivate existing active area
    await fastify.db.update(serviceAreaConfig)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(serviceAreaConfig.isActive, true));

    const [area] = await fastify.db.insert(serviceAreaConfig).values({
      homeBaseAddress: body.data.address,
      centerLat: String(body.data.lat),
      centerLng: String(body.data.lng),
      radiusMiles: String(body.data.radiusMiles),
      isActive: true,
    }).returning();

    return reply.send({ success: true, data: area });
  });

  // ── Pricing tiers ───────────────────────────────────────────────────────

  fastify.get('/api/v1/admin/pricing', { preHandler }, async (_request, reply) => {
    const tiers = await fastify.db.select().from(pricingConfig)
      .where(eq(pricingConfig.isActive, true))
      .orderBy(pricingConfig.sortOrder);
    return reply.send({ success: true, data: tiers });
  });

  fastify.put('/api/v1/admin/pricing', { preHandler }, async (request, reply) => {
    const body = pricingUpdateSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
    }

    const updated = await Promise.all(
      body.data.map((tier) =>
        fastify.db.update(pricingConfig)
          .set({ tierLabel: tier.tierLabel, priceCents: tier.priceCents, updatedAt: new Date() })
          .where(and(eq(pricingConfig.id, tier.id), eq(pricingConfig.isActive, true)))
          .returning(),
      ),
    );

    return reply.send({ success: true, data: updated.flat() });
  });

  // ── Payment links (driver profile) ─────────────────────────────────────

  fastify.get('/api/v1/admin/payment-links', { preHandler }, async (request, reply) => {
    const payload = request.user as { sub: string };
    const [profile] = await fastify.db.select({
      paypalLink: driverProfiles.paypalLink,
      venmoLink: driverProfiles.venmoLink,
    }).from(driverProfiles).where(eq(driverProfiles.userId, payload.sub)).limit(1);

    return reply.send({ success: true, data: profile ?? { paypalLink: null, venmoLink: null } });
  });

  fastify.put('/api/v1/admin/payment-links', { preHandler }, async (request, reply) => {
    const body = paymentLinksSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
    }
    const payload = request.user as { sub: string };

    const [existing] = await fastify.db.select().from(driverProfiles)
      .where(eq(driverProfiles.userId, payload.sub)).limit(1);

    if (existing) {
      await fastify.db.update(driverProfiles)
        .set({ paypalLink: body.data.paypalLink ?? null, venmoLink: body.data.venmoLink ?? null, updatedAt: new Date() })
        .where(eq(driverProfiles.userId, payload.sub));
    } else {
      await fastify.db.insert(driverProfiles).values({
        userId: payload.sub,
        paypalLink: body.data.paypalLink ?? null,
        venmoLink: body.data.venmoLink ?? null,
      });
    }

    return reply.send({ success: true, data: { paypalLink: body.data.paypalLink ?? null, venmoLink: body.data.venmoLink ?? null } });
  });

  // ── Dashboard ───────────────────────────────────────────────────────────

  fastify.get('/api/v1/admin/dashboard', { preHandler }, async (request, reply) => {
    const payload = request.user as { sub: string };

    // Active jobs (non-waitlisted, non-terminal)
    const activeStatuses: JobStatus[] = ['pending', 'assigned', 'en_route', 'arrived', 'in_progress', 'completed'];
    const activeJobs = await fastify.db
      .select(jobBoardSelect)
      .from(jobs)
      .innerJoin(customerProfiles, eq(jobs.customerId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .leftJoin(pricingConfig, eq(jobs.drivewayTierId, pricingConfig.id))
      .where(inArray(jobs.status, activeStatuses))
      .orderBy(jobs.createdAt);

    // Waitlisted jobs
    const waitlistedJobs = await fastify.db
      .select(jobBoardSelect)
      .from(jobs)
      .innerJoin(customerProfiles, eq(jobs.customerId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .leftJoin(pricingConfig, eq(jobs.drivewayTierId, pricingConfig.id))
      .where(eq(jobs.status, 'waitlisted'))
      .orderBy(jobs.createdAt);

    // Driver status
    const [driverProfile] = await fastify.db.select({ status: driverProfiles.status })
      .from(driverProfiles)
      .where(eq(driverProfiles.userId, payload.sub))
      .limit(1);

    // Today's summary
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const [todaySummary] = await fastify.db
      .select({
        count: sql<number>`count(*)::int`,
        totalCents: sql<number>`coalesce(sum(payment_amount_cents), 0)::int`,
      })
      .from(jobs)
      .where(and(eq(jobs.status, 'completed'), gte(jobs.completedAt, startOfDay)));

    return reply.send({
      success: true,
      data: {
        activeJobs,
        waitlistedJobs,
        driverStatus: driverProfile?.status ?? 'offline',
        todaySummary: {
          count: todaySummary?.count ?? 0,
          totalCents: todaySummary?.totalCents ?? 0,
        },
      },
    });
  });

  // ── Driver status ───────────────────────────────────────────────────────

  fastify.get('/api/v1/admin/driver-status', { preHandler }, async (request, reply) => {
    const payload = request.user as { sub: string };
    const [profile] = await fastify.db.select({ status: driverProfiles.status })
      .from(driverProfiles)
      .where(eq(driverProfiles.userId, payload.sub))
      .limit(1);
    return reply.send({ success: true, data: { status: profile?.status ?? 'offline' } });
  });

  // ── Manual job creation ─────────────────────────────────────────────────

  fastify.post('/api/v1/admin/jobs', { preHandler }, async (request, reply) => {
    const body = manualJobSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: body.error.flatten().fieldErrors } });
    }

    const { customerName, customerPhone, customerEmail, drivewayTierId, jobType, scheduledFor, notes, jobAddress, jobLat, jobLng } = body.data;

    // Require at least one contact field
    if (!customerPhone && !customerEmail) {
      return reply.status(400).send({ success: false, error: { code: 'CONTACT_REQUIRED', message: 'Provide at least a phone or email for the customer' } });
    }

    // Look up existing customer by phone, then email
    let customerProfileId: string | null = null;

    if (customerPhone) {
      const [existingUser] = await fastify.db.select().from(users)
        .where(eq(users.phone, customerPhone)).limit(1);
      if (existingUser) {
        const [cp] = await fastify.db.select().from(customerProfiles)
          .where(eq(customerProfiles.userId, existingUser.id)).limit(1);
        if (cp) customerProfileId = cp.id;
      }
    }

    if (!customerProfileId && customerEmail) {
      const [existingUser] = await fastify.db.select().from(users)
        .where(eq(users.email, customerEmail)).limit(1);
      if (existingUser) {
        const [cp] = await fastify.db.select().from(customerProfiles)
          .where(eq(customerProfiles.userId, existingUser.id)).limit(1);
        if (cp) customerProfileId = cp.id;
      }
    }

    // Create soft account if customer not found
    if (!customerProfileId) {
      // Use provided email or generate a placeholder (email is required by schema)
      const email = customerEmail ?? `noemail+${customerPhone!.replace(/\D/g, '')}@placeholder.invalid`;
      const [newUser] = await fastify.db.insert(users).values({
        email,
        phone: customerPhone ?? null,
        passwordHash: '',
        role: 'customer',
        fullName: customerName,
      }).returning();
      if (!newUser) return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create customer' } });

      const [newProfile] = await fastify.db.insert(customerProfiles).values({
        userId: newUser.id,
        isSoftAccount: true,
        preferredContact: customerPhone ? 'sms' : 'email',
      }).returning();
      if (!newProfile) return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create customer profile' } });

      customerProfileId = newProfile.id;
    }

    // Get tier price
    const [tier] = await fastify.db.select().from(pricingConfig)
      .where(eq(pricingConfig.id, drivewayTierId)).limit(1);
    if (!tier) {
      return reply.status(400).send({ success: false, error: { code: 'INVALID_TIER', message: 'Invalid driveway tier' } });
    }

    const [job] = await fastify.db.insert(jobs).values({
      customerId: customerProfileId,
      jobAddress,
      jobLat: String(jobLat),
      jobLng: String(jobLng),
      drivewayTierId,
      jobType,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      specialInstructions: notes ?? null,
      quotedPriceCents: tier.priceCents,
      source: 'admin',
      serviceType: 'residential',
    }).returning();

    return reply.status(201).send({ success: true, data: job });
  });

  // ── Price override ──────────────────────────────────────────────────────

  fastify.patch('/api/v1/admin/jobs/:id/price', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = priceOverrideSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'newPriceCents required' } });
    }

    const [job] = await fastify.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!job) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } });

    const terminalStatuses: string[] = ['cancelled', 'rejected', 'completed'];
    if (terminalStatuses.includes(job.status)) {
      return reply.status(409).send({ success: false, error: { code: 'JOB_TERMINAL', message: `Cannot override price on a ${job.status} job` } });
    }

    const payload = request.user as { sub: string };
    const oldPrice = job.finalPriceCents ?? job.quotedPriceCents;

    // Atomic: log change and update price in one transaction
    const updated = await fastify.db.transaction(async (tx) => {
      await tx.insert(jobPriceChanges).values({
        jobId: id,
        changedByUserId: payload.sub,
        oldPriceCents: oldPrice,
        newPriceCents: body.data.newPriceCents,
      });
      const [row] = await tx.update(jobs)
        .set({ finalPriceCents: body.data.newPriceCents, updatedAt: new Date() })
        .where(eq(jobs.id, id))
        .returning();
      return row;
    });

    return reply.send({ success: true, data: updated });
  });

  // ── Record payment ──────────────────────────────────────────────────────

  fastify.post('/api/v1/admin/jobs/:id/payment', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = paymentRecordSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
    }

    const [job] = await fastify.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!job) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } });

    const payableStatuses: string[] = ['in_progress', 'completed'];
    if (!payableStatuses.includes(job.status)) {
      return reply.status(409).send({ success: false, error: { code: 'JOB_NOT_PAYABLE', message: `Cannot record payment on a ${job.status} job` } });
    }

    const [updated] = await fastify.db.update(jobs)
      .set({ paymentMethod: body.data.paymentMethod, paymentAmountCents: body.data.paymentAmountCents, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();

    return reply.send({ success: true, data: updated });
  });

  // ── Job status transition (admin-initiated) ─────────────────────────────

  fastify.patch('/api/v1/admin/jobs/:id/status', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = statusTransitionSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'status required' } });
    }

    const [job] = await fastify.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!job) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } });

    try {
      assertValidTransition(job.status as JobStatus, body.data.status as JobStatus);
    } catch {
      return reply.status(400).send({ success: false, error: { code: 'INVALID_STATUS_TRANSITION', message: `Cannot transition from ${job.status} to ${body.data.status}` } });
    }

    const payload = request.user as { sub: string };
    const now = new Date();
    const newStatus = body.data.status as JobStatus;

    const [updated] = await fastify.db.update(jobs).set({
      status: newStatus,
      updatedAt: now,
      ...(newStatus === 'assigned' ? { assignedAt: now } : {}),
      ...(newStatus === 'arrived' ? { arrivedAt: now } : {}),
      ...(newStatus === 'in_progress' ? { startedAt: now } : {}),
      ...(newStatus === 'completed' ? { completedAt: now } : {}),
      ...(newStatus === 'cancelled' ? { cancelledAt: now } : {}),
    }).where(eq(jobs.id, id)).returning();

    // Record status history
    await fastify.db.insert(jobStatusHistory).values({
      jobId: id,
      fromStatus: job.status,
      toStatus: newStatus,
      changedByUserId: payload.sub,
    });

    return reply.send({ success: true, data: updated });
  });

  // ── Waitlist ────────────────────────────────────────────────────────────

  fastify.get('/api/v1/admin/waitlist', { preHandler }, async (_request, reply) => {
    const entries = await fastify.db
      .select({
        id: waitlist.id,
        jobAddress: waitlist.jobAddress,
        drivewayTierId: waitlist.drivewayTierId,
        notes: waitlist.notes,
        contactPhone: waitlist.contactPhone,
        contactEmail: waitlist.contactEmail,
        status: waitlist.status,
        createdAt: waitlist.createdAt,
        tierLabel: pricingConfig.tierLabel,
        tierPriceCents: pricingConfig.priceCents,
      })
      .from(waitlist)
      .leftJoin(pricingConfig, eq(waitlist.drivewayTierId, pricingConfig.id))
      .where(eq(waitlist.status, 'waiting'))
      .orderBy(waitlist.createdAt);

    return reply.send({ success: true, data: entries });
  });

  fastify.post('/api/v1/admin/waitlist/:id/promote', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [entry] = await fastify.db.select().from(waitlist).where(eq(waitlist.id, id)).limit(1);
    if (!entry) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Waitlist entry not found' } });
    if (entry.status !== 'waiting') {
      return reply.status(409).send({ success: false, error: { code: 'ALREADY_PROMOTED', message: 'Waitlist entry is not in waiting status' } });
    }

    // Get tier price for the job
    let priceCents = 0;
    if (entry.drivewayTierId) {
      const [tier] = await fastify.db.select().from(pricingConfig)
        .where(eq(pricingConfig.id, entry.drivewayTierId)).limit(1);
      priceCents = tier?.priceCents ?? 0;
    }

    // Atomic: promote entry and create job in one transaction
    const job = await fastify.db.transaction(async (tx) => {
      // Re-check status inside transaction to prevent concurrent promotes
      const [locked] = await tx.select().from(waitlist).where(eq(waitlist.id, id)).limit(1);
      if (!locked || locked.status !== 'waiting') return null;

      const [newJob] = await tx.insert(jobs).values({
        customerId: entry.customerId,
        jobAddress: entry.jobAddress,
        jobLat: entry.jobLat,
        jobLng: entry.jobLng,
        drivewayTierId: entry.drivewayTierId ?? undefined,
        jobType: 'asap',
        specialInstructions: entry.notes ?? null,
        quotedPriceCents: priceCents,
        source: 'admin',
        serviceType: 'residential',
        status: 'pending',
      }).returning();

      await tx.update(waitlist)
        .set({ status: 'promoted', promotedJobId: newJob!.id, promotedAt: new Date() })
        .where(eq(waitlist.id, id));

      return newJob;
    });

    if (!job) {
      return reply.status(409).send({ success: false, error: { code: 'ALREADY_PROMOTED', message: 'Waitlist entry was already promoted' } });
    }

    return reply.send({ success: true, data: job });
  });

  fastify.delete('/api/v1/admin/waitlist/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [entry] = await fastify.db.select().from(waitlist).where(eq(waitlist.id, id)).limit(1);
    if (!entry) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Waitlist entry not found' } });

    await fastify.db.update(waitlist)
      .set({ status: 'cancelled' })
      .where(eq(waitlist.id, id));

    return reply.send({ success: true, data: null });
  });
};

export default adminRoutes;
