import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { UserLocation, FriendLocationDisplay, FriendContact } from '../types';
import { sanitizeLocationPayload } from '../lib/validators';
import { getFreshnessStatus, calculateHaversineDistanceMeters, metersToKilometers } from '../lib/distance';

const LOCAL_STORAGE_LOC_PREFIX = 'friendflow_loc_';

export const locationService = {
  /**
   * Updates current user's shared location in Firestore.
   * Path: users/{uid}/location/current
   */
  async updateCurrentLocation(uid: string, rawLocation: Partial<UserLocation>): Promise<void> {
    const { valid, cleanLocation, errorMessage } = sanitizeLocationPayload(rawLocation);
    if (!valid || !cleanLocation) {
      throw new Error(errorMessage || 'Invalid location payload');
    }

    if (isFirebaseConfigured() && db) {
      const locRef = doc(db, 'users', uid, 'location', 'current');
      await setDoc(locRef, cleanLocation);
    } else {
      localStorage.setItem(`${LOCAL_STORAGE_LOC_PREFIX}${uid}`, JSON.stringify(cleanLocation));
      window.dispatchEvent(new Event('friendflow_location_changed'));
    }
  },

  /**
   * Sets location sharing state.
   * If turned OFF: immediately marks sharingEnabled=false on profile,
   * and deletes the location document so rules deny any read.
   */
  async setSharingEnabled(uid: string, enabled: boolean): Promise<void> {
    if (isFirebaseConfigured() && db) {
      // 1. Update user profile sharing flag
      await updateDoc(doc(db, 'users', uid), {
        sharingEnabled: enabled,
        updatedAt: Date.now(),
      });

      // 2. If disabled, delete current location document immediately
      if (!enabled) {
        try {
          await deleteDoc(doc(db, 'users', uid, 'location', 'current'));
        } catch (e) {
          console.warn('[locationService] Notice deleting current location doc on stop sharing:', e);
        }
      }
    } else {
      const rawUser = localStorage.getItem('friendflow_mock_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        u.sharingEnabled = enabled;
        localStorage.setItem('friendflow_mock_user', JSON.stringify(u));
      }
      const rawUsers = localStorage.getItem('friendflow_mock_users_db');
      if (rawUsers) {
        const dbUsers = JSON.parse(rawUsers);
        if (dbUsers[uid]) {
          dbUsers[uid].profile.sharingEnabled = enabled;
          localStorage.setItem('friendflow_mock_users_db', JSON.stringify(dbUsers));
        }
      }
      if (!enabled) {
        localStorage.removeItem(`${LOCAL_STORAGE_LOC_PREFIX}${uid}`);
      }
      window.dispatchEvent(new Event('friendflow_location_changed'));
      window.dispatchEvent(new Event('friendflow_data_changed'));
    }
  },

  /**
   * Subscribes to live shared locations of accepted friends.
   * Cleans up listeners dynamically when friends list changes.
   */
  subscribeFriendLocations(
    friends: FriendContact[],
    myLocation: UserLocation | null,
    callback: (locations: Record<string, FriendLocationDisplay>) => void
  ): () => void {
    if (!friends || friends.length === 0) {
      callback({});
      return () => {};
    }

    const friendLocationMap: Record<string, FriendLocationDisplay> = {};

    const updateAndNotify = () => {
      callback({ ...friendLocationMap });
    };

    if (isFirebaseConfigured() && db) {
      const unsubs: (() => void)[] = [];

      for (const friend of friends) {
        const locRef = doc(db, 'users', friend.uid, 'location', 'current');
        const unsub = onSnapshot(
          locRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserLocation;
              const freshness = getFreshnessStatus(data.capturedAt, true);

              let distKm: number | undefined;
              if (myLocation) {
                try {
                  const m = calculateHaversineDistanceMeters(
                    myLocation.latitude,
                    myLocation.longitude,
                    data.latitude,
                    data.longitude
                  );
                  distKm = metersToKilometers(m);
                } catch {
                  // ignore coordinate errors
                }
              }

              friendLocationMap[friend.uid] = {
                ...data,
                friendUid: friend.uid,
                displayName: friend.displayName,
                username: friend.username,
                avatarUrl: friend.avatarUrl,
                freshness,
                distanceFromMeKm: distKm,
              };
            } else {
              delete friendLocationMap[friend.uid];
            }
            updateAndNotify();
          },
          (err) => {
            // Permission denied or friend stopped sharing: immediately clear from map
            console.warn(`[locationService] Location read denied/unavailable for friend ${friend.uid}:`, err.message);
            delete friendLocationMap[friend.uid];
            updateAndNotify();
          }
        );
        unsubs.push(unsub);
      }

      return () => {
        unsubs.forEach((u) => u());
      };
    } else {
      // Mock local subscription
      const update = () => {
        const rawUsers = localStorage.getItem('friendflow_mock_users_db');
        const users = rawUsers ? JSON.parse(rawUsers) : {};

        for (const friend of friends) {
          const userEntry = users[friend.uid]?.profile;
          // Only show if friend has sharingEnabled === true
          if (userEntry?.sharingEnabled) {
            const rawLoc = localStorage.getItem(`${LOCAL_STORAGE_LOC_PREFIX}${friend.uid}`);
            if (rawLoc) {
              const data = JSON.parse(rawLoc) as UserLocation;
              const freshness = getFreshnessStatus(data.capturedAt, true);

              let distKm: number | undefined;
              if (myLocation) {
                try {
                  const m = calculateHaversineDistanceMeters(
                    myLocation.latitude,
                    myLocation.longitude,
                    data.latitude,
                    data.longitude
                  );
                  distKm = metersToKilometers(m);
                } catch {}
              }

              friendLocationMap[friend.uid] = {
                ...data,
                friendUid: friend.uid,
                displayName: friend.displayName,
                username: friend.username,
                avatarUrl: friend.avatarUrl,
                freshness,
                distanceFromMeKm: distKm,
              };
            } else {
              delete friendLocationMap[friend.uid];
            }
          } else {
            delete friendLocationMap[friend.uid];
          }
        }
        updateAndNotify();
      };

      update();
      window.addEventListener('friendflow_location_changed', update);
      window.addEventListener('storage', update);
      return () => {
        window.removeEventListener('friendflow_location_changed', update);
        window.removeEventListener('storage', update);
      };
    }
  },
};
