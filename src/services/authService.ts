import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile } from '../types';
import { normalizeUsername, isValidUsername, isValidDisplayName, isValidEmail } from '../lib/validators';

const LOCAL_STORAGE_USER_KEY = 'friendflow_mock_user';
const LOCAL_STORAGE_USERS_DB_KEY = 'friendflow_mock_users_db';

// In-memory/localStorage fallback helpers for testing without active Firebase credentials
function getMockUsers(): Record<string, { email: string; pass: string; profile: UserProfile }> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_DB_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMockUsers(users: Record<string, { email: string; pass: string; profile: UserProfile }>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_DB_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving mock users', e);
  }
}

export const authService = {
  async register(
    email: string,
    password: string,
    username: string,
    displayName: string
  ): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }
    const userVal = isValidUsername(username);
    if (!userVal.valid) {
      throw new Error(userVal.message || 'Invalid username.');
    }
    const nameVal = isValidDisplayName(displayName);
    if (!nameVal.valid) {
      throw new Error(nameVal.message || 'Invalid display name.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const cleanUsername = username.trim();
    const usernameLower = normalizeUsername(cleanUsername);

    if (isFirebaseConfigured() && auth && db) {
      // Create Firebase Auth user
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const uid = credential.user.uid;

      // Unique friend code (e.g. FF-XXXX)
      const friendCode = `FF-${uid.substring(0, 4).toUpperCase()}`;

      const profile: UserProfile = {
        uid,
        username: cleanUsername,
        usernameLower,
        displayName: displayName.trim(),
        friendCode,
        sharingEnabled: false, // OFF by default
        sharingAudience: 'accepted_friends',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await setDoc(doc(db, 'users', uid), profile);
      return profile;
    } else {
      // Local fallback mode
      const mockUsers = getMockUsers();
      // Check if username is taken in mock DB
      const existing = Object.values(mockUsers).find(
        (u) => u.profile.usernameLower === usernameLower
      );
      if (existing) {
        throw new Error(`Username "@${cleanUsername}" is already taken.`);
      }

      const uid = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const profile: UserProfile = {
        uid,
        username: cleanUsername,
        usernameLower,
        displayName: displayName.trim(),
        friendCode: `FF-${uid.substring(5, 9).toUpperCase()}`,
        sharingEnabled: false,
        sharingAudience: 'accepted_friends',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockUsers[uid] = {
        email: cleanEmail,
        pass: password,
        profile,
      };
      saveMockUsers(mockUsers);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      return profile;
    }
  },

  async login(email: string, password: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();

    if (isFirebaseConfigured() && auth && db) {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const userDoc = await getDoc(doc(db, 'users', credential.user.uid));

      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }

      // If document does not exist yet, build initial profile
      const newProfile: UserProfile = {
        uid: credential.user.uid,
        username: credential.user.email?.split('@')[0] || 'user',
        usernameLower: (credential.user.email?.split('@')[0] || 'user').toLowerCase(),
        displayName: credential.user.displayName || credential.user.email?.split('@')[0] || 'User',
        sharingEnabled: false,
        sharingAudience: 'accepted_friends',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, 'users', credential.user.uid), newProfile);
      return newProfile;
    } else {
      const mockUsers = getMockUsers();
      const found = Object.values(mockUsers).find(
        (u) => u.email.toLowerCase() === cleanEmail && u.pass === password
      );

      if (!found) {
        // If empty mock DB, generate a demo profile for convenience
        const uid = `mock_${cleanEmail.split('@')[0]}`;
        const profile: UserProfile = {
          uid,
          username: cleanEmail.split('@')[0],
          usernameLower: cleanEmail.split('@')[0].toLowerCase(),
          displayName: cleanEmail.split('@')[0],
          friendCode: `FF-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          sharingEnabled: false,
          sharingAudience: 'accepted_friends',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        mockUsers[uid] = { email: cleanEmail, pass: password, profile };
        saveMockUsers(mockUsers);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
        return profile;
      }

      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(found.profile));
      return found.profile;
    }
  },

  async logout(): Promise<void> {
    if (isFirebaseConfigured() && auth) {
      await signOut(auth);
    }
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  },

  async resetPassword(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }

    if (isFirebaseConfigured() && auth) {
      await sendPasswordResetEmail(auth, cleanEmail);
    } else {
      // Mock simulation
      await new Promise((resolve) => setTimeout(resolve, 600));
      return;
    }
  },

  getCurrentStoredUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  subscribeToAuth(callback: (profile: UserProfile | null) => void): () => void {
    if (isFirebaseConfigured() && auth && db) {
      const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
        if (!user) {
          localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
          callback(null);
          return;
        }

        try {
          const userDoc = await getDoc(doc(db!, 'users', user.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
            callback(profile);
          } else {
            const profile: UserProfile = {
              uid: user.uid,
              username: user.email?.split('@')[0] || 'user',
              usernameLower: (user.email?.split('@')[0] || 'user').toLowerCase(),
              displayName: user.displayName || 'User',
              sharingEnabled: false,
              sharingAudience: 'accepted_friends',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            callback(profile);
          }
        } catch (e) {
          console.error('[authService] Error fetching profile:', e);
          callback(authService.getCurrentStoredUser());
        }
      });
      return unsubscribe;
    } else {
      // Local storage listener
      const user = authService.getCurrentStoredUser();
      callback(user);
      const listener = () => {
        callback(authService.getCurrentStoredUser());
      };
      window.addEventListener('storage', listener);
      return () => window.removeEventListener('storage', listener);
    }
  },
};
