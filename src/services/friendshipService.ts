import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { FriendRequest, Friendship, FriendContact, UserProfile } from '../types';
import { PublicUserResult } from './profileService';

export function getCanonicalPairId(uidA: string, uidB: string): string {
  return uidA < uidB ? `${uidA}_${uidB}` : `${uidB}_${uidA}`;
}

const LOCAL_STORAGE_REQUESTS = 'friendflow_mock_requests';
const LOCAL_STORAGE_FRIENDSHIPS = 'friendflow_mock_friendships';

function getMockRequests(): FriendRequest[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REQUESTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMockRequests(reqs: FriendRequest[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_REQUESTS, JSON.stringify(reqs));
  } catch (e) {
    console.error('Error saving mock requests', e);
  }
}

function getMockFriendships(): Friendship[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FRIENDSHIPS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMockFriendships(fs: Friendship[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_FRIENDSHIPS, JSON.stringify(fs));
  } catch (e) {
    console.error('Error saving mock friendships', e);
  }
}

export const friendshipService = {
  /**
   * Sends a friend request. Prevents self-friending and duplicate pending requests.
   */
  async sendFriendRequest(
    currentUser: UserProfile,
    target: PublicUserResult
  ): Promise<FriendRequest> {
    if (currentUser.uid === target.uid) {
      throw new Error('You cannot send a friend request to yourself.');
    }

    const pairId = getCanonicalPairId(currentUser.uid, target.uid);

    if (isFirebaseConfigured() && db) {
      // Check if already friends
      const friendshipDoc = await getDoc(doc(db, 'friendships', pairId));
      if (friendshipDoc.exists() && friendshipDoc.data()?.status === 'accepted') {
        throw new Error('You are already friends with this user.');
      }

      // Check existing pending requests between these two users
      const reqsRef = collection(db, 'friendRequests');
      const q = query(
        reqsRef,
        where('fromUid', 'in', [currentUser.uid, target.uid]),
        where('toUid', 'in', [currentUser.uid, target.uid]),
        where('status', '==', 'pending')
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        throw new Error('A pending friend request already exists between you and this user.');
      }

      const newReqRef = doc(collection(db, 'friendRequests'));
      const newRequest: FriendRequest = {
        id: newReqRef.id,
        fromUid: currentUser.uid,
        fromDisplayName: currentUser.displayName,
        fromUsername: currentUser.username,
        fromAvatarUrl: currentUser.avatarUrl,
        toUid: target.uid,
        toDisplayName: target.displayName,
        toUsername: target.username,
        toAvatarUrl: target.avatarUrl,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await setDoc(newReqRef, newRequest);
      return newRequest;
    } else {
      // Mock mode
      const mockFriendships = getMockFriendships();
      if (mockFriendships.some((f) => f.id === pairId && f.status === 'accepted')) {
        throw new Error('You are already friends with this user.');
      }

      const mockReqs = getMockRequests();
      const existing = mockReqs.find(
        (r) =>
          ((r.fromUid === currentUser.uid && r.toUid === target.uid) ||
            (r.fromUid === target.uid && r.toUid === currentUser.uid)) &&
          r.status === 'pending'
      );
      if (existing) {
        throw new Error('A pending friend request already exists between you and this user.');
      }

      const newRequest: FriendRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        fromUid: currentUser.uid,
        fromDisplayName: currentUser.displayName,
        fromUsername: currentUser.username,
        fromAvatarUrl: currentUser.avatarUrl,
        toUid: target.uid,
        toDisplayName: target.displayName,
        toUsername: target.username,
        toAvatarUrl: target.avatarUrl,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockReqs.push(newRequest);
      saveMockRequests(mockReqs);
      window.dispatchEvent(new Event('friendflow_data_changed'));
      return newRequest;
    }
  },

  /**
   * Accepts a friend request and generates canonical friendship record.
   */
  async acceptFriendRequest(request: FriendRequest, currentUid: string): Promise<void> {
    if (request.toUid !== currentUid) {
      throw new Error('Only the recipient of a friend request can accept it.');
    }

    const pairId = getCanonicalPairId(request.fromUid, request.toUid);
    const userA = request.fromUid < request.toUid ? request.fromUid : request.toUid;
    const userB = request.fromUid < request.toUid ? request.toUid : request.fromUid;

    if (isFirebaseConfigured() && db) {
      // 1. Update request status to accepted
      await updateDoc(doc(db, 'friendRequests', request.id), {
        status: 'accepted',
        updatedAt: Date.now(),
      });

      // 2. Create canonical friendship record
      const friendship: Friendship = {
        id: pairId,
        userA,
        userB,
        status: 'accepted',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, 'friendships', pairId), friendship);
    } else {
      const mockReqs = getMockRequests();
      const idx = mockReqs.findIndex((r) => r.id === request.id);
      if (idx !== -1) {
        mockReqs[idx].status = 'accepted';
        mockReqs[idx].updatedAt = Date.now();
        saveMockRequests(mockReqs);
      }

      const mockFriendships = getMockFriendships();
      if (!mockFriendships.some((f) => f.id === pairId)) {
        mockFriendships.push({
          id: pairId,
          userA,
          userB,
          status: 'accepted',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        saveMockFriendships(mockFriendships);
      }
      window.dispatchEvent(new Event('friendflow_data_changed'));
    }
  },

  /**
   * Rejects a friend request.
   */
  async rejectFriendRequest(requestId: string, currentUid: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      const reqRef = doc(db, 'friendRequests', requestId);
      const snap = await getDoc(reqRef);
      if (snap.exists() && snap.data()?.toUid === currentUid) {
        await updateDoc(reqRef, { status: 'rejected', updatedAt: Date.now() });
      }
    } else {
      const mockReqs = getMockRequests();
      const r = mockReqs.find((req) => req.id === requestId && req.toUid === currentUid);
      if (r) {
        r.status = 'rejected';
        r.updatedAt = Date.now();
        saveMockRequests(mockReqs);
        window.dispatchEvent(new Event('friendflow_data_changed'));
      }
    }
  },

  /**
   * Cancels an outgoing pending request.
   */
  async cancelFriendRequest(requestId: string, currentUid: string): Promise<void> {
    if (isFirebaseConfigured() && db) {
      const reqRef = doc(db, 'friendRequests', requestId);
      const snap = await getDoc(reqRef);
      if (snap.exists() && snap.data()?.fromUid === currentUid) {
        await updateDoc(reqRef, { status: 'cancelled', updatedAt: Date.now() });
      }
    } else {
      const mockReqs = getMockRequests();
      const r = mockReqs.find((req) => req.id === requestId && req.fromUid === currentUid);
      if (r) {
        r.status = 'cancelled';
        r.updatedAt = Date.now();
        saveMockRequests(mockReqs);
        window.dispatchEvent(new Event('friendflow_data_changed'));
      }
    }
  },

  /**
   * Removes an existing friendship (PRIV-02). Immediately revokes access.
   */
  async removeFriend(currentUid: string, friendUid: string): Promise<void> {
    const pairId = getCanonicalPairId(currentUid, friendUid);

    if (isFirebaseConfigured() && db) {
      await deleteDoc(doc(db, 'friendships', pairId));
    } else {
      let mockFriendships = getMockFriendships();
      mockFriendships = mockFriendships.filter((f) => f.id !== pairId);
      saveMockFriendships(mockFriendships);
      window.dispatchEvent(new Event('friendflow_data_changed'));
    }
  },

  /**
   * Subscribes to accepted friends of the given user.
   */
  subscribeAcceptedFriends(
    currentUid: string,
    callback: (friends: FriendContact[]) => void
  ): () => void {
    if (isFirebaseConfigured() && db) {
      // In Firestore, pair could have currentUid in userA or userB
      const qA = query(
        collection(db, 'friendships'),
        where('userA', '==', currentUid),
        where('status', '==', 'accepted')
      );
      const qB = query(
        collection(db, 'friendships'),
        where('userB', '==', currentUid),
        where('status', '==', 'accepted')
      );

      let friendsA: FriendContact[] = [];
      let friendsB: FriendContact[] = [];

      const notify = () => {
        const combined = [...friendsA, ...friendsB];
        callback(combined);
      };

      const fetchFriendDetails = async (otherUid: string, friendshipId: string, friendSince: number): Promise<FriendContact> => {
        try {
          const userSnap = await getDoc(doc(db!, 'users', otherUid));
          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            return {
              uid: data.uid,
              username: data.username,
              displayName: data.displayName,
              avatarUrl: data.avatarUrl,
              friendshipId,
              friendSince,
              sharingEnabled: data.sharingEnabled,
            };
          }
        } catch (e) {
          console.warn('Error fetching friend profile', e);
        }
        return {
          uid: otherUid,
          username: otherUid,
          displayName: 'Friend',
          friendshipId,
          friendSince,
        };
      };

      const unsubA = onSnapshot(qA, async (snap) => {
        const promises = snap.docs.map((d) => {
          const data = d.data() as Friendship;
          return fetchFriendDetails(data.userB, d.id, data.createdAt);
        });
        friendsA = await Promise.all(promises);
        notify();
      });

      const unsubB = onSnapshot(qB, async (snap) => {
        const promises = snap.docs.map((d) => {
          const data = d.data() as Friendship;
          return fetchFriendDetails(data.userA, d.id, data.createdAt);
        });
        friendsB = await Promise.all(promises);
        notify();
      });

      return () => {
        unsubA();
        unsubB();
      };
    } else {
      // Mock subscription
      const update = () => {
        const mockFriendships = getMockFriendships();
        const rawUsers = localStorage.getItem('friendflow_mock_users_db');
        const users = rawUsers ? JSON.parse(rawUsers) : {};

        const userFriendships = mockFriendships.filter(
          (f) => (f.userA === currentUid || f.userB === currentUid) && f.status === 'accepted'
        );

        const contacts: FriendContact[] = userFriendships.map((f) => {
          const otherUid = f.userA === currentUid ? f.userB : f.userA;
          const userEntry = users[otherUid]?.profile;
          return {
            uid: otherUid,
            username: userEntry?.username || otherUid,
            displayName: userEntry?.displayName || 'Friend',
            avatarUrl: userEntry?.avatarUrl,
            friendshipId: f.id,
            friendSince: f.createdAt,
            sharingEnabled: userEntry?.sharingEnabled ?? false,
          };
        });

        callback(contacts);
      };

      update();
      window.addEventListener('friendflow_data_changed', update);
      window.addEventListener('storage', update);
      return () => {
        window.removeEventListener('friendflow_data_changed', update);
        window.removeEventListener('storage', update);
      };
    }
  },

  /**
   * Subscribes to incoming and outgoing friend requests.
   */
  subscribeFriendRequests(
    currentUid: string,
    callback: (sent: FriendRequest[], received: FriendRequest[]) => void
  ): () => void {
    if (isFirebaseConfigured() && db) {
      const qSent = query(
        collection(db, 'friendRequests'),
        where('fromUid', '==', currentUid),
        where('status', '==', 'pending')
      );
      const qRecv = query(
        collection(db, 'friendRequests'),
        where('toUid', '==', currentUid),
        where('status', '==', 'pending')
      );

      let sent: FriendRequest[] = [];
      let received: FriendRequest[] = [];

      const notify = () => callback(sent, received);

      const unsubSent = onSnapshot(qSent, (snap) => {
        sent = snap.docs.map((d) => ({ ...d.data(), id: d.id } as FriendRequest));
        notify();
      });

      const unsubRecv = onSnapshot(qRecv, (snap) => {
        received = snap.docs.map((d) => ({ ...d.data(), id: d.id } as FriendRequest));
        notify();
      });

      return () => {
        unsubSent();
        unsubRecv();
      };
    } else {
      const update = () => {
        const mockReqs = getMockRequests();
        const sent = mockReqs.filter((r) => r.fromUid === currentUid && r.status === 'pending');
        const received = mockReqs.filter((r) => r.toUid === currentUid && r.status === 'pending');
        callback(sent, received);
      };

      update();
      window.addEventListener('friendflow_data_changed', update);
      window.addEventListener('storage', update);
      return () => {
        window.removeEventListener('friendflow_data_changed', update);
        window.removeEventListener('storage', update);
      };
    }
  },
};
