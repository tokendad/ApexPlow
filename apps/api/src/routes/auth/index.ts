import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { users, customerProfiles, refreshTokens } from '../../db/schema/index';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['customer', 'driver', 'admin']).default('customer'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/v1/auth/register', async (request, reply) => {
    const body = registerSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: body.error.flatten().fieldErrors } });
    }
    const { email, password, fullName, phone, role } = body.data;

    const existing = await fastify.db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return reply.status(409).send({ success: false, error: { code: 'EMAIL_IN_USE', message: 'Email already registered' } });
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const [user] = await fastify.db.insert(users).values({ email, phone: phone ?? null, passwordHash, role, fullName }).returning();
    if (!user) return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create user' } });

    if (role === 'customer') {
      await fastify.db.insert(customerProfiles).values({ userId: user.id });
    }

    const accessToken = fastify.jwt.sign({ sub: user.id, role: user.role, name: user.fullName }, { expiresIn: '15m' });
    return reply.status(201).send({ success: true, data: { accessToken, user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName } } });
  });

  fastify.post('/api/v1/auth/login', async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
    }
    const { email, password } = body.data;

    const [user] = await fastify.db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !await argon2.verify(user.passwordHash, password)) {
      return reply.status(401).send({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    if (!user.isActive) {
      return reply.status(403).send({ success: false, error: { code: 'ACCOUNT_DISABLED', message: 'Account is disabled' } });
    }

    const accessToken = fastify.jwt.sign({ sub: user.id, role: user.role, name: user.fullName }, { expiresIn: '15m' });
    const rawRefresh = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await fastify.db.insert(refreshTokens).values({ userId: user.id, tokenHash: hashToken(rawRefresh), expiresAt });

    reply.setCookie('refresh_token', rawRefresh, { httpOnly: true, secure: process.env['NODE_ENV'] === 'production', sameSite: 'strict', path: '/api/v1/auth', maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 });
    return reply.send({ success: true, data: { accessToken, user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName } } });
  });

  fastify.post('/api/v1/auth/refresh', async (request, reply) => {
    const rawToken = (request.cookies as Record<string, string>)['refresh_token'];
    if (!rawToken) return reply.status(401).send({ success: false, error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token required' } });

    const hash = hashToken(rawToken);
    const [token] = await fastify.db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, hash)).limit(1);
    if (!token || token.revokedAt || token.expiresAt < new Date()) {
      return reply.status(401).send({ success: false, error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is invalid or expired' } });
    }

    // Rotate: revoke old, issue new
    await fastify.db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, token.id));
    const [user] = await fastify.db.select().from(users).where(eq(users.id, token.userId)).limit(1);
    if (!user) return reply.status(401).send({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });

    const accessToken = fastify.jwt.sign({ sub: user.id, role: user.role, name: user.fullName }, { expiresIn: '15m' });
    const newRaw = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await fastify.db.insert(refreshTokens).values({ userId: user.id, tokenHash: hashToken(newRaw), expiresAt });

    reply.setCookie('refresh_token', newRaw, { httpOnly: true, secure: process.env['NODE_ENV'] === 'production', sameSite: 'strict', path: '/api/v1/auth', maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 });
    return reply.send({ success: true, data: { accessToken } });
  });

  fastify.post('/api/v1/auth/logout', async (request, reply) => {
    const rawToken = (request.cookies as Record<string, string>)['refresh_token'];
    if (rawToken) {
      await fastify.db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.tokenHash, hashToken(rawToken)));
    }
    reply.clearCookie('refresh_token', { path: '/api/v1/auth' });
    return reply.send({ success: true, data: null });
  });
};

export default authRoutes;
