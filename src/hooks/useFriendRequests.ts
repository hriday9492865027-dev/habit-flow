import { useState, useEffect } from 'react';
import { FriendRequest } from '../types';
import { friendshipService } from '../services/friendshipService';
import { PublicUserResult } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';

export function useFriendRequests() {
  const { currentUser } = useAuth();
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setSentRequests([]);
      setReceivedRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = friendshipService.subscribeFriendRequests(currentUser.uid, (sent, recv) => {
      setSentRequests(sent);
      setReceivedRequests(recv);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const sendRequest = async (target: PublicUserResult) => {
    if (!currentUser) return;
    setActionError(null);
    try {
      await friendshipService.sendFriendRequest(currentUser, target);
    } catch (err: any) {
      setActionError(err.message || 'Failed to send friend request.');
      throw err;
    }
  };

  const acceptRequest = async (request: FriendRequest) => {
    if (!currentUser) return;
    setActionError(null);
    try {
      await friendshipService.acceptFriendRequest(request, currentUser.uid);
    } catch (err: any) {
      setActionError(err.message || 'Failed to accept friend request.');
      throw err;
    }
  };

  const rejectRequest = async (requestId: string) => {
    if (!currentUser) return;
    setActionError(null);
    try {
      await friendshipService.rejectFriendRequest(requestId, currentUser.uid);
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject friend request.');
      throw err;
    }
  };

  const cancelRequest = async (requestId: string) => {
    if (!currentUser) return;
    setActionError(null);
    try {
      await friendshipService.cancelFriendRequest(requestId, currentUser.uid);
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel friend request.');
      throw err;
    }
  };

  const removeFriend = async (friendUid: string) => {
    if (!currentUser) return;
    setActionError(null);
    try {
      await friendshipService.removeFriend(currentUser.uid, friendUid);
    } catch (err: any) {
      setActionError(err.message || 'Failed to remove friend.');
      throw err;
    }
  };

  return {
    sentRequests,
    receivedRequests,
    loading,
    actionError,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriend,
  };
}
