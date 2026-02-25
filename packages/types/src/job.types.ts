export type JobStatus =
  | 'pending'
  | 'assigned'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'waitlisted';

export type JobType = 'asap' | 'scheduled';
export type ServiceType = 'residential' | 'commercial';
export type PaymentMethod = 'cash' | 'card' | 'paypal' | 'venmo' | 'other';

export interface Job {
  id: string;
  customerId: string;
  driverId: string | null;
  locationId: string | null;
  jobAddress: string;
  jobLat: number;
  jobLng: number;
  status: JobStatus;
  source: 'customer' | 'admin';
  serviceType: ServiceType;
  jobType: JobType;
  drivewayTierId: number;
  specialInstructions: string | null;
  quotedPriceCents: number;
  finalPriceCents: number | null;
  discountCents: number;
  tipAmountCents: number | null;
  requestedAt: string;
  scheduledFor: string | null;
  assignedAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  cancellationChargeCents: number | null;
  paymentMethod: PaymentMethod | null;
  paymentAmountCents: number | null;
  recurringSchedule: unknown | null;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const VALID_JOB_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  pending: ['assigned', 'rejected', 'cancelled', 'waitlisted'],
  waitlisted: ['pending', 'cancelled'],
  assigned: ['en_route', 'cancelled', 'rejected'],
  en_route: ['arrived', 'cancelled'],
  arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  rejected: [],
};
