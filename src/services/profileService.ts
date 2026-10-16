import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile } from '../types';
import { normalizeUsername } from '../lib/validators';

export interface PublicUserResult {
  uid: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  friendCode?: string;
}

export const profileService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured() && db) {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } else {
      const raw = localStorage.getItem('friendflow_mock_users_db');
      if (raw) {
        const users = JSON.parse(raw);
        if (users[uid]) return users[uid].profile;
      }
      return null;
    }
  },

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const safeUpdates: Partial<UserProfile> = {
      ...updates,
      updatedAt: Date.now(),
    };

    if (safeUpdates.username) {
      safeUpdates.usernameLower = normalizeUsername(safeUpdates.username);
    }

    if (isFirebaseConfigured() && db) {
      await updateDoc(doc(db, 'users', uid), safeUpdates);
    } else {
      const raw = localStorage.getItem('friendflow_mock_users_db');
      if (raw) {
        const users = JSON.parse(raw);
        if (users[uid]) {
          users[uid].profile = { ...users[uid].profile, ...safeUpdates };
          localStorage.setItem('friendflow_mock_users_db', JSON.stringify(users));
        }
      }
      const activeRaw = localStorage.getItem('friendflow_mock_user');
      if (activeRaw) {
        const active = JSON.parse(activeRaw);
        if (active.uid === uid) {
          localStorage.setItem('friendflow_mock_user', JSON.stringify({ ...active, ...safeUpdates }));
        }
      }
    }
  },

  /**
   * Search users by username (prefix/exact).
   * STRICT SECURITY: Returns ONLY public profile fields (uid, username, displayName, avatarUrl).
   * Coordinates and private email are strictly excluded.
   */
  async searchUsersByUsername(
    rawQuery: string,
    currentUid: string
  ): Promise<PublicUserResult[]> {
    const q = normalizeUsername(rawQuery);
    if (!q || q.length < 2) return [];

    if (isFirebaseConfigured() && db) {
      const usersRef = collection(db, 'users');
      // Query by prefix using Firestore unicode boundary
      const qRef = query(
        usersRef,
        where('usernameLower', '>=', q),
        where('usernameLower', '<=', q + '\uf8ff'),
        limit(10)
      );

      const snapshot = await getDocs(qRef);
      const results: PublicUserResult[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        // Do not return self in search results
        if (data.uid !== currentUid) {
          results.push({
            uid: data.uid,
            username: data.username,
            displayName: data.displayName,
            avatarUrl: data.avatarUrl,
            friendCode: data.friendCode,
          });
        }
      });

      return results;
    } else {
      // Mock search
      const raw = localStorage.getItem('friendflow_mock_users_db');
      if (!raw) return [];
      const users = JSON.parse(raw);
      const results: PublicUserResult[] = [];

      for (const key of Object.keys(users)) {
        const u = users[key].profile as UserProfile;
        if (u.uid !== currentUid && u.usernameLower.includes(q)) {
          results.push({
            uid: u.uid,
            username: u.username,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            friendCode: u.friendCode,
          });
        }
      }
      return results;
    }
  },

  /**
   * Complete account and data deletion flow (PRIV-03).
   */
  async deleteAccount(uid: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      // 1. Delete location document
      try {
        await deleteDoc(doc(db, 'users', uid, 'location', 'current'));
      } catch (e) {
        console.warn('Error deleting location doc during account cleanup:', e);
      }
      // 2. Delete user profile
      await deleteDoc(doc(db, 'users', uid));
    } else {
      const raw = localStorage.getItem('friendflow_mock_users_db');
      if (raw) {
        const users = JSON.parse(raw);
        delete users[uid];
        localStorage.setItem('friendflow_mock_users_db', JSON.stringify(users));
      }
      localStorage.removeItem('friendflow_mock_user');
      localStorage.removeItem(`friendflow_loc_${uid}`);
    }
  },
};
