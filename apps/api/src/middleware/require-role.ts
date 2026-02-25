import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole } from '@plowdispatch/types';

export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    const payload = request.user as { role: UserRole };
    if (!roles.includes(payload.role)) {
      return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
  };
}
