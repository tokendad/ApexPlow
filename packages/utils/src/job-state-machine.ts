import type { JobStatus } from '@plowdispatch/types';
import { VALID_JOB_TRANSITIONS } from '@plowdispatch/types';

export function isValidTransition(from: JobStatus, to: JobStatus): boolean {
  return VALID_JOB_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertValidTransition(from: JobStatus, to: JobStatus): void {
  if (!isValidTransition(from, to)) {
    throw new Error(`Invalid job status transition: ${from} → ${to}`);
  }
}
