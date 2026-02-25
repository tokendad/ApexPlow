import { describe, it, expect } from 'vitest';
import { isValidTransition, assertValidTransition } from './job-state-machine.js';

describe('isValidTransition', () => {
  it('allows valid forward transitions', () => {
    expect(isValidTransition('pending', 'assigned')).toBe(true);
    expect(isValidTransition('assigned', 'en_route')).toBe(true);
    expect(isValidTransition('en_route', 'arrived')).toBe(true);
    expect(isValidTransition('arrived', 'in_progress')).toBe(true);
    expect(isValidTransition('in_progress', 'completed')).toBe(true);
  });

  it('allows waitlist transitions', () => {
    expect(isValidTransition('pending', 'waitlisted')).toBe(true);
    expect(isValidTransition('waitlisted', 'pending')).toBe(true);
  });

  it('allows cancellation from multiple states', () => {
    expect(isValidTransition('pending', 'cancelled')).toBe(true);
    expect(isValidTransition('assigned', 'cancelled')).toBe(true);
    expect(isValidTransition('en_route', 'cancelled')).toBe(true);
    expect(isValidTransition('arrived', 'cancelled')).toBe(true);
    expect(isValidTransition('in_progress', 'cancelled')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(isValidTransition('completed', 'pending')).toBe(false);
    expect(isValidTransition('cancelled', 'pending')).toBe(false);
    expect(isValidTransition('rejected', 'assigned')).toBe(false);
    expect(isValidTransition('in_progress', 'pending')).toBe(false);
    expect(isValidTransition('completed', 'cancelled')).toBe(false);
  });

  it('rejects same-status transitions', () => {
    expect(isValidTransition('pending', 'pending')).toBe(false);
    expect(isValidTransition('completed', 'completed')).toBe(false);
  });
});

describe('assertValidTransition', () => {
  it('does not throw for valid transitions', () => {
    expect(() => assertValidTransition('pending', 'assigned')).not.toThrow();
  });

  it('throws for invalid transitions', () => {
    expect(() => assertValidTransition('completed', 'pending')).toThrow(
      'Invalid job status transition: completed → pending',
    );
  });
});
