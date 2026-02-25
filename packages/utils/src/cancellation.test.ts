import { describe, it, expect } from 'vitest';
import { computeCancellationCharge } from './cancellation.js';
import type { CancellationRule } from '@plowdispatch/types';

const RULES: CancellationRule[] = [
  // ASAP rules
  { id: 1, jobType: 'asap', hoursBeforeThreshold: null, chargePercent: 0, description: 'Before en-route: free' },
  { id: 2, jobType: 'asap', hoursBeforeThreshold: null, chargePercent: 25, description: 'After en-route: 25%' },
  // Scheduled rules (hoursBeforeThreshold = lower bound of each window)
  { id: 5, jobType: 'scheduled', hoursBeforeThreshold: 12, chargePercent: 0, description: '>12 hours: free' },
  { id: 3, jobType: 'scheduled', hoursBeforeThreshold: 6, chargePercent: 25, description: '6-12 hours: 25%' },
  { id: 4, jobType: 'scheduled', hoursBeforeThreshold: 0, chargePercent: 50, description: '<6 hours: 50%' },
];

describe('computeCancellationCharge — ASAP jobs', () => {
  it('returns 0% charge when driver is not en-route', () => {
    const result = computeCancellationCharge(10000, 'asap', null, false, RULES);
    expect(result.chargePercent).toBe(0);
    expect(result.chargeCents).toBe(0);
    expect(result.isFree).toBe(true);
  });

  it('returns 25% charge when driver is en-route', () => {
    const result = computeCancellationCharge(10000, 'asap', null, true, RULES);
    expect(result.chargePercent).toBe(25);
    expect(result.chargeCents).toBe(2500);
    expect(result.isFree).toBe(false);
  });
});

describe('computeCancellationCharge — Scheduled jobs', () => {
  const now = new Date('2026-02-25T12:00:00Z');

  it('returns 0% for cancellation >12 hours before', () => {
    const scheduledFor = new Date('2026-02-26T01:00:00Z'); // 13 hours out
    const result = computeCancellationCharge(8500, 'scheduled', scheduledFor, false, RULES, now);
    expect(result.chargePercent).toBe(0);
    expect(result.isFree).toBe(true);
  });

  it('returns 25% for cancellation 6-12 hours before', () => {
    const scheduledFor = new Date('2026-02-25T20:00:00Z'); // 8 hours out
    const result = computeCancellationCharge(8500, 'scheduled', scheduledFor, false, RULES, now);
    expect(result.chargePercent).toBe(25);
    expect(result.chargeCents).toBe(2125);
  });

  it('returns 50% for cancellation <6 hours before', () => {
    const scheduledFor = new Date('2026-02-25T14:00:00Z'); // 2 hours out
    const result = computeCancellationCharge(8500, 'scheduled', scheduledFor, false, RULES, now);
    expect(result.chargePercent).toBe(50);
    expect(result.chargeCents).toBe(4250);
  });

  it('returns 0% when no scheduledFor date is provided', () => {
    const result = computeCancellationCharge(8500, 'scheduled', null, false, RULES, now);
    expect(result.chargePercent).toBe(0);
    expect(result.isFree).toBe(true);
  });
});
