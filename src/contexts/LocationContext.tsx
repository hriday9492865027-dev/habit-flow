import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { UserLocation, LocationPermissionState } from '../types';
import { useAuth } from './AuthContext';
import { locationService } from '../services/locationService';
import { locationTrackingManager } from '../services/backgroundLocationService';

interface LocationContextType {
  myLocation: UserLocation | null;
  isSharing: boolean;
  isTrackingActive: boolean;
  permissionState: LocationPermissionState;
  startSharing: () => Promise<boolean>;
  stopSharing: () => Promise<void>;
  refreshLocation: () => Promise<boolean>;
  requestPermission: () => Promise<LocationPermissionState>;
  trackingError: string | null;
  isNativePlatform: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateProfile } = useAuth();
  const [myLocation, setMyLocation] = useState<UserLocation | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [isTrackingActive, setIsTrackingActive] = useState<boolean>(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<LocationPermissionState>({
    hasRequested: false,
    isGranted: false,
    isDenied: false,
    isServiceDisabled: false,
  });

  const isNativePlatform = locationTrackingManager.isNative();
  const activeUidRef = useRef<string | null>(null);
  const isSharingRef = useRef(false);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    isSharingRef.current = isSharing;
  }, [isSharing]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Check initial permissions
  useEffect(() => {
    locationTrackingManager.checkPermissions().then(setPermissionState);
  }, []);

  const handleLocationUpdate = useCallback(
    async (loc: UserLocation) => {
      setMyLocation(loc);
      setTrackingError(null);

      const uid = currentUserRef.current?.uid;
      if (uid && isSharingRef.current) {
        try {
          await locationService.updateCurrentLocation(uid, loc);
        } catch (e: any) {
          console.warn('[LocationContext] Error updating remote location:', e);
        }
      }
    },
    []
  );

  const handleLocationError = useCallback((errorMsg: string) => {
    setTrackingError(errorMsg);
    console.warn('[LocationContext] Location error:', errorMsg);
  }, []);

  // Sync with profile sharingEnabled status
  useEffect(() => {
    if (currentUser) {
      activeUidRef.current = currentUser.uid;
      const enabled = currentUser.sharingEnabled ?? false;
      setIsSharing(enabled);

      // Auto-resume tracking if user previously opted in to sharing
      if (enabled) {
        locationTrackingManager
          .startTracking(handleLocationUpdate, handleLocationError)
          .then((started) => {
            if (started) setIsTrackingActive(true);
          });
      }
    } else {
      // User signed out -> stop any active tracking immediately
      if (activeUidRef.current) {
        locationTrackingManager.stopTracking();
      }
      activeUidRef.current = null;
      setMyLocation(null);
      setIsSharing(false);
      setIsTrackingActive(false);
    }
  }, [currentUser, handleLocationUpdate, handleLocationError]);

  const startSharing = useCallback(async (): Promise<boolean> => {
    if (!currentUser) return false;
    setTrackingError(null);
    setIsSharing(true);
    isSharingRef.current = true;

    try {
      await locationService.setSharingEnabled(currentUser.uid, true);
      await updateProfile({ sharingEnabled: true });
    } catch (err: any) {
      console.error('[LocationContext] Error setting sharing enabled:', err);
    }

    const started = await locationTrackingManager.startTracking(
      handleLocationUpdate,
      handleLocationError,
      true // force restart to acquire immediate fresh fix
    );

    if (started) {
      setIsTrackingActive(true);
      return true;
    } else {
      setIsTrackingActive(false);
      return false;
    }
  }, [currentUser, handleLocationUpdate, handleLocationError, updateProfile]);

  const refreshLocation = useCallback(async (): Promise<boolean> => {
    setTrackingError(null);
    const started = await locationTrackingManager.startTracking(
      handleLocationUpdate,
      handleLocationError,
      true
    );
    if (started) {
      setIsTrackingActive(true);
    }
    locationTrackingManager.checkPermissions().then(setPermissionState);
    return started;
  }, [handleLocationUpdate, handleLocationError]);

  const stopSharing = useCallback(async (): Promise<void> => {
    if (!currentUser) return;

    isSharingRef.current = false;
    await locationTrackingManager.stopTracking();
    setIsTrackingActive(false);
    setIsSharing(false);
    setMyLocation((prev) => (prev ? { ...prev, isSharing: false } : null));

    try {
      await locationService.setSharingEnabled(currentUser.uid, false);
      await updateProfile({ sharingEnabled: false });
    } catch (err) {
      console.error('[LocationContext] Error setting sharing disabled:', err);
    }
  }, [currentUser, updateProfile]);

  const requestPermission = useCallback(async (): Promise<LocationPermissionState> => {
    const status = await locationTrackingManager.checkPermissions();
    setPermissionState(status);
    return status;
  }, []);

  return (
    <LocationContext.Provider
      value={{
        myLocation,
        isSharing,
        isTrackingActive,
        permissionState,
        startSharing,
        stopSharing,
        refreshLocation,
        requestPermission,
        trackingError,
        isNativePlatform,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
