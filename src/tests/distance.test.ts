import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistanceMeters,
  formatDistance,
  getFreshnessStatus,
  isValidCoordinate,
  metersToKilometers,
} from '../lib/distance';

describe('Distance and Location Utilities', () => {
  it('validates coordinate boundaries properly', () => {
    expect(isValidCoordinate(0, 0)).toBe(true);
    expect(isValidCoordinate(90, 180)).toBe(true);
    expect(isValidCoordinate(-90, -180)).toBe(true);
    expect(isValidCoordinate(91, 0)).toBe(false);
    expect(isValidCoordinate(0, 181)).toBe(false);
    expect(isValidCoordinate(NaN, 0)).toBe(false);
  });

  it('calculates accurate Haversine distance for known benchmarks', () => {
    // London (51.5074, -0.1278) to Paris (48.8566, 2.3522) ~ 343-344 km
    const londonParis = calculateHaversineDistanceMeters(
      51.5074,
      -0.1278,
      48.8566,
      2.3522
    );
    const km = metersToKilometers(londonParis);
    expect(km).toBeGreaterThan(340);
    expect(km).toBeLessThan(346);

    // Identical points should return 0 meters
    expect(calculateHaversineDistanceMeters(37.7749, -122.4194, 37.7749, -122.4194)).toBe(0);

    // Short distance test (approx 111 meters per 0.001 deg lat at equator)
    const shortDist = calculateHaversineDistanceMeters(0, 0, 0.001, 0);
    expect(Math.round(shortDist)).toBe(111);
  });

  it('formats distance appropriately with meters and kilometers', () => {
    expect(formatDistance(450)).toBe('450 m');
    expect(formatDistance(454)).toBe('450 m');
    expect(formatDistance(999)).toBe('1000 m');
    expect(formatDistance(1250)).toBe('1.25 km');
    expect(formatDistance(15300)).toBe('15.3 km');
  });

  it('correctly categorizes location freshness based on timestamps', () => {
    const now = Date.now();
    // 30 seconds ago -> live
    expect(getFreshnessStatus(now - 30 * 1000, true)).toBe('live');
    // 5 minutes ago -> recent
    expect(getFreshnessStatus(now - 5 * 60 * 1000, true)).toBe('recent');
    // 25 minutes ago -> stale
    expect(getFreshnessStatus(now - 25 * 60 * 1000, true)).toBe('stale');
    // sharing off -> unavailable
    expect(getFreshnessStatus(now - 1000, false)).toBe('unavailable');
    // missing timestamp -> unavailable
    expect(getFreshnessStatus(null, true)).toBe('unavailable');
  });
});
