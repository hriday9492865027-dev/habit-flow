export type SharingAudience = 'accepted_friends';

export type FreshnessStatus = 'live' | 'recent' | 'stale' | 'offline' | 'unavailable';

export interface UserProfile {
  uid: string;
  username: string;
  usernameLower: string;
  displayName: string;
  avatarUrl?: string;
  friendCode?: string;
  sharingEnabled: boolean;
  sharingAudience: SharingAudience;
  createdAt: number;
  updatedAt: number;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromDisplayName?: string;
  fromUsername?: string;
  fromAvatarUrl?: string;
  toUid: string;
  toDisplayName?: string;
  toUsername?: string;
  toAvatarUrl?: string;
  status: FriendRequestStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Friendship {
  id: string; // userA_userB (alphabetically sorted UIDs)
  userA: string;
  userB: string;
  status: 'accepted';
  createdAt: number;
  updatedAt: number;
}

export interface FriendContact {
  uid: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  friendshipId: string;
  friendSince: number;
  sharingEnabled?: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: number;
  receivedAt: number;
  platform: 'web' | 'android' | 'ios';
  isSharing?: boolean;
}

export interface FriendLocationDisplay extends UserLocation {
  friendUid: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  freshness: FreshnessStatus;
  distanceFromMeKm?: number;
}

export interface DistanceCalculationResult {
  haversineKm: number;
  haversineMeters: number;
  formattedHaversine: string;
  roadDistanceKm?: number;
  roadDurationMinutes?: number;
  roadGeometry?: [number, number][]; // [lat, lng] array for polyline
  roadProviderStatus: 'success' | 'fallback_only' | 'loading' | 'failed';
  roadErrorMessage?: string;
}

export interface LocationPermissionState {
  hasRequested: boolean;
  isGranted: boolean;
  isDenied: boolean;
  isServiceDisabled: boolean;
  errorMessage?: string;
}
