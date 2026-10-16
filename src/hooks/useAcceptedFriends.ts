import { useState, useEffect } from 'react';
import { FriendContact } from '../types';
import { friendshipService } from '../services/friendshipService';
import { useAuth } from '../contexts/AuthContext';

export function useAcceptedFriends() {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState<FriendContact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUser) {
      setFriends([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = friendshipService.subscribeAcceptedFriends(currentUser.uid, (data) => {
      setFriends(data);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  return { friends, loading };
}
