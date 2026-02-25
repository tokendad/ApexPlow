export type UserRole = 'driver' | 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  fullName: string;
  isActive: boolean;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  organizationId: string | null;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  name: string;
  iat: number;
  exp: number;
  jti: string;
}
