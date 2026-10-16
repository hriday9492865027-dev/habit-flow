import { useState, useEffect } from 'react';
import { FriendContact, FriendLocationDisplay, UserLocation } from '../types';
import { locationService } from '../services/locationService';

export function useAuthorizedFriendLocations(
  friends: FriendContact[],
  myLocation: UserLocation | null
) {
  const [locations, setLocations] = useState<Record<string, FriendLocationDisplay>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!friends || friends.length === 0) {
      setLocations({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = locationService.subscribeFriendLocations(friends, myLocation, (locMap) => {
      setLocations(locMap);
      setLoading(false);
    });

    return () => unsub();
  }, [friends, myLocation]);

  return { locations, loading };
}
