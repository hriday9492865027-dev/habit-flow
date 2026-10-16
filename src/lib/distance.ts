import { FreshnessStatus } from '../types';

const EARTH_RADIUS_METERS = 6371008.8; // WGS84 mean earth radius

/**
 * Validates that latitude and longitude are within standard geographical boundaries.
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Calculates straight-line distance between two coordinates using the Haversine formula.
 * Returns distance in meters.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    throw new Error('Invalid coordinate provided for Haversine calculation');
  }

  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Converts meters to kilometers.
 */
export function metersToKilometers(meters: number): number {
  return meters / 1000;
}

/**
 * Formats a distance in meters into human-readable representation:
 * - < 1 km: e.g. "450 m"
 * - >= 1 km: e.g. "2.4 km" or "12.85 km"
 */
export function formatDistance(meters: number): string {
  if (meters < 0 || isNaN(meters)) return 'Unknown';
  if (meters < 1000) {
    const roundedMeters = Math.round(meters / 10) * 10;
    return `${roundedMeters} m`;
  }
  const km = meters / 1000;
  if (km < 10) {
    return `${km.toFixed(2)} km`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Configurable thresholds for location freshness:
 * - LIVE: captured within last 2 minutes (120,000 ms)
 * - RECENT: captured within last 15 minutes (900,000 ms)
 * - STALE: older than 15 minutes
 */
export const FRESHNESS_THRESHOLDS = {
  LIVE_MS: 2 * 60 * 1000, // 2 minutes
  RECENT_MS: 15 * 60 * 1000, // 15 minutes
};

/**
 * Computes location freshness status given a timestamp in milliseconds.
 */
export function getFreshnessStatus(
  capturedAt: number | undefined | null,
  isSharing: boolean = true
): FreshnessStatus {
  if (!isSharing || !capturedAt) {
    return 'unavailable';
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - capturedAt);

  if (diffMs <= FRESHNESS_THRESHOLDS.LIVE_MS) {
    return 'live';
  }
  if (diffMs <= FRESHNESS_THRESHOLDS.RECENT_MS) {
    return 'recent';
  }
  return 'stale';
}

/**
 * Formats relative time elapsed since the location capture (e.g. "Just now", "3m ago", "1h ago").
 */
export function formatRelativeTime(timestamp: number | undefined | null): string {
  if (!timestamp) return 'Never';
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (diffSec < 45) return 'Just now';
  if (diffSec < 90) return '1 min ago';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 7200) return '1 hour ago';
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  return `${Math.floor(diffSec / 86400)} days ago`;
}
