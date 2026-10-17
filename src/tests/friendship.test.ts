import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCanonicalPairId, friendshipService } from '../services/friendshipService';
import { profileService } from '../services/profileService';
import { locationService } from '../services/locationService';
import { sanitizeLocationPayload, isValidUsername } from '../lib/validators';
import { UserProfile } from '../types';

vi.mock('../lib/firebase', () => ({
  isFirebaseConfigured: () => false,
  db: null,
  auth: null,
}));

// In-memory mock for Node test environment
if (typeof localStorage === 'undefined') {
  let store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
}

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  (globalThis as any).Event = class Event {};
}

describe('Friendship, Privacy, and Security Logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates deterministic canonical pair IDs regardless of argument order', () => {
    const pair1 = getCanonicalPairId('uid_alice', 'uid_bob');
    const pair2 = getCanonicalPairId('uid_bob', 'uid_alice');
    expect(pair1).toBe('uid_alice_uid_bob');
    expect(pair2).toBe('uid_alice_uid_bob');
  });

  it('strictly forbids self-friending', async () => {
    const user: UserProfile = {
      uid: 'user_123',
      username: 'sam',
      usernameLower: 'sam',
      displayName: 'Sam',
      sharingEnabled: false,
      sharingAudience: 'accepted_friends',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await expect(
      friendshipService.sendFriendRequest(user, {
        uid: 'user_123',
        username: 'sam',
        displayName: 'Sam',
      })
    ).rejects.toThrow('You cannot send a friend request to yourself.');
  });

  it('validates username format and rejects illegal characters', () => {
    expect(isValidUsername('al').valid).toBe(false); // too short
    expect(isValidUsername('valid_user123').valid).toBe(true);
    expect(isValidUsername('invalid user!').valid).toBe(false); // spaces and symbols
    expect(isValidUsername('this_username_is_way_too_long_to_be_allowed').valid).toBe(false);
  });

  it('sanitizes and validates location coordinates, rejecting out-of-range writes', () => {
    const valid = sanitizeLocationPayload({
      latitude: 37.7749,
      longitude: -122.4194,
      accuracyMeters: 12.4,
    });
    expect(valid.valid).toBe(true);
    expect(valid.cleanLocation?.latitude).toBe(37.7749);

    const outOfBoundsLat = sanitizeLocationPayload({
      latitude: 95.0, // Invalid latitude (> 90)
      longitude: 10.0,
    });
    expect(outOfBoundsLat.valid).toBe(false);

    const outOfBoundsLng = sanitizeLocationPayload({
      latitude: 10.0,
      longitude: -185.0, // Invalid longitude (< -180)
    });
    expect(outOfBoundsLng.valid).toBe(false);
  });

  it('ensures user search results never expose private coordinates', async () => {
    const mockUsers = {
      user_target: {
        email: 'secret_email@test.com',
        pass: 'password123',
        profile: {
          uid: 'user_target',
          username: 'jordan',
          usernameLower: 'jordan',
          displayName: 'Jordan Walker',
          friendCode: 'FF-JORD',
          sharingEnabled: true,
          sharingAudience: 'accepted_friends',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    };
    localStorage.setItem('friendflow_mock_users_db', JSON.stringify(mockUsers));

    const results = await profileService.searchUsersByUsername('jord', 'viewer_uid');
    expect(results).toHaveLength(1);
    const found = results[0];
    expect(found.username).toBe('jordan');
    expect(found.displayName).toBe('Jordan Walker');

    // Verify coordinates or private email are NOT in the return object
    expect((found as any).latitude).toBeUndefined();
    expect((found as any).longitude).toBeUndefined();
    expect((found as any).email).toBeUndefined();
  });

  it('immediately purges stored coordinates when location sharing is stopped', async () => {
    const uid = 'user_test_stop';
    // Start with a location
    await locationService.updateCurrentLocation(uid, {
      latitude: 40.7128,
      longitude: -74.006,
      accuracyMeters: 5,
    });

    expect(localStorage.getItem(`friendflow_loc_${uid}`)).not.toBeNull();

    // Turn sharing off
    await locationService.setSharingEnabled(uid, false);

    // Stored location record must be completely cleared from storage
    expect(localStorage.getItem(`friendflow_loc_${uid}`)).toBeNull();
  });
});
