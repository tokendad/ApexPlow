import { describe, it, expect } from 'vitest';
import { haversineDistanceMiles, isWithinServiceArea } from './haversine.js';

describe('haversineDistanceMiles', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineDistanceMiles(42.36, -71.06, 42.36, -71.06)).toBeCloseTo(0, 5);
  });

  it('calculates known distance — Boston to Providence (~41 miles straight-line)', () => {
    // Boston: 42.3601, -71.0589 | Providence: 41.8240, -71.4128
    // Straight-line haversine distance is ~41 miles (driving distance is ~49 miles)
    const dist = haversineDistanceMiles(42.3601, -71.0589, 41.824, -71.4128);
    expect(dist).toBeGreaterThan(40);
    expect(dist).toBeLessThan(43);
  });

  it('calculates short distance accurately', () => {
    // Two points ~1 mile apart in Boston
    const dist = haversineDistanceMiles(42.36, -71.06, 42.3744, -71.06);
    expect(dist).toBeGreaterThan(0.9);
    expect(dist).toBeLessThan(1.1);
  });
});

describe('isWithinServiceArea', () => {
  const centerLat = 42.36;
  const centerLng = -71.06;
  const radiusMiles = 10;

  it('returns true for a point within the radius', () => {
    // ~2 miles north
    expect(isWithinServiceArea(42.389, -71.06, centerLat, centerLng, radiusMiles)).toBe(true);
  });

  it('returns false for a point outside the radius', () => {
    // Providence — ~49 miles away
    expect(isWithinServiceArea(41.824, -71.4128, centerLat, centerLng, radiusMiles)).toBe(false);
  });

  it('returns true for the center point itself', () => {
    expect(isWithinServiceArea(centerLat, centerLng, centerLat, centerLng, radiusMiles)).toBe(true);
  });

  it('handles edge case near the radius boundary (just inside)', () => {
    // 9.9 miles north of center — within 10-mile radius
    // Using 10/69.0 would overshoot by ~0.006 miles due to flat-earth approximation
    const borderLat = centerLat + (9.9 / 69.0);
    expect(isWithinServiceArea(borderLat, centerLng, centerLat, centerLng, radiusMiles)).toBe(true);
  });
});
