export type SseServerMessage =
  | { type: 'job_assigned'; payload: { jobId: string; customerName: string; address: string; tier: string; priceCents: number } }
  | { type: 'job_status'; payload: { jobId: string; newStatus: string; ts: string } }
  | { type: 'job_cancelled'; payload: { jobId: string; reason: string | null } }
  | { type: 'new_job_request'; payload: { jobId: string; address: string; serviceType: string; tier: string } }
  | { type: 'driver_status'; payload: { driverId: string; status: string } }
  | { type: 'ping' };
