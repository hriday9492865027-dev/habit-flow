import { isValidCoordinate } from './distance';
import { UserLocation } from '../types';

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(username: string): { valid: boolean; message?: string } {
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters long.' };
  }
  if (trimmed.length > 20) {
    return { valid: false, message: 'Username cannot exceed 20 characters.' };
  }
  const regex = /^[a-zA-Z0-9_]+$/;
  if (!regex.test(trimmed)) {
    return { valid: false, message: 'Username may only contain letters, numbers, and underscores.' };
  }
  return { valid: true };
}

export function isValidDisplayName(name: string): { valid: boolean; message?: string } {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, message: 'Display name must be at least 2 characters.' };
  }
  if (trimmed.length > 40) {
    return { valid: false, message: 'Display name cannot exceed 40 characters.' };
  }
  return { valid: true };
}

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}

/**
 * Validates and sanitizes location payload before writing to Firestore.
 */
export function sanitizeLocationPayload(data: Partial<UserLocation>): {
  valid: boolean;
  cleanLocation?: UserLocation;
  errorMessage?: string;
} {
  const { latitude, longitude, accuracyMeters, capturedAt, platform } = data;

  if (latitude === undefined || longitude === undefined || !isValidCoordinate(latitude, longitude)) {
    return { valid: false, errorMessage: 'Invalid coordinates.' };
  }

  const cleanAccuracy = typeof accuracyMeters === 'number' && !isNaN(accuracyMeters) && accuracyMeters >= 0
    ? Math.round(accuracyMeters * 10) / 10
    : 10;

  const validPlatforms = ['web', 'android', 'ios'] as const;
  const cleanPlatform = platform && validPlatforms.includes(platform as any) ? platform : 'web';

  const cleanCapturedAt = typeof capturedAt === 'number' && capturedAt > 0 ? capturedAt : Date.now();

  return {
    valid: true,
    cleanLocation: {
      latitude,
      longitude,
      accuracyMeters: cleanAccuracy,
      capturedAt: cleanCapturedAt,
      receivedAt: Date.now(),
      platform: cleanPlatform,
      isSharing: true,
    },
  };
}
