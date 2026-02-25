import type { CancellationRule } from '@plowdispatch/types';

export interface CancellationResult {
  chargePercent: number;
  chargeCents: number;
  isFree: boolean;
}

/**
 * Computes the cancellation charge based on job type, timing, and driver status.
 * Reads rules from the database (passed in) — no hardcoded percentages.
 */
export function computeCancellationCharge(
  quotedPriceCents: number,
  jobType: 'asap' | 'scheduled',
  scheduledFor: Date | null,
  driverEnRoute: boolean,
  rules: CancellationRule[],
  now: Date = new Date(),
): CancellationResult {
  const applicable = rules.filter((r) => r.jobType === jobType);

  if (jobType === 'asap') {
    const matchingRule = applicable.find((r) =>
      driverEnRoute ? r.chargePercent > 0 : r.chargePercent === 0,
    );
    const chargePercent = matchingRule?.chargePercent ?? 0;
    const chargeCents = Math.round(quotedPriceCents * (chargePercent / 100));
    return { chargePercent, chargeCents, isFree: chargePercent === 0 };
  }

  // Scheduled: determine charge based on hours until scheduled time
  if (!scheduledFor) {
    return { chargePercent: 0, chargeCents: 0, isFree: true };
  }

  const hoursUntil = (scheduledFor.getTime() - now.getTime()) / (1000 * 60 * 60);

  // hoursBeforeThreshold is the lower bound of each charging window.
  // Sort descending so the highest (widest) window is checked first.
  // The first rule where hoursUntil >= threshold is the applicable rule.
  const timedRules = applicable
    .filter((r) => r.hoursBeforeThreshold !== null)
    .sort((a, b) => (b.hoursBeforeThreshold ?? 0) - (a.hoursBeforeThreshold ?? 0));

  let chargePercent = 0;
  for (const rule of timedRules) {
    if (hoursUntil >= (rule.hoursBeforeThreshold ?? 0)) {
      chargePercent = rule.chargePercent;
      break;
    }
  }

  const chargeCents = Math.round(quotedPriceCents * (chargePercent / 100));
  return { chargePercent, chargeCents, isFree: chargePercent === 0 };
}
