import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';
import { UserLocation, LocationPermissionState } from '../types';

export interface BackgroundGeolocationPlugin {
  addWatcher(
    options: {
      backgroundTitle?: string;
      backgroundMessage?: string;
      requestPermissions?: boolean;
      stale?: boolean;
      distanceFilter?: number;
    },
    callback: (location: any, error?: any) => void
  ): Promise<string>;
  removeWatcher(options: { id: string }): Promise<void>;
  openSettings(): Promise<void>;
}

// Safely register or obtain Capgo background geolocation plugin
let BackgroundGeolocation: BackgroundGeolocationPlugin | null = null;

if (Capacitor.isNativePlatform()) {
  try {
    BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');
  } catch (err) {
    console.warn('[backgroundLocationService] Native plugin not available:', err);
  }
}

export type LocationUpdateCallback = (location: UserLocation) => void;
export type LocationErrorCallback = (error: string) => void;

class LocationTrackingManager {
  private activeWatcherId: string | number | null = null;
  private isTracking = false;
  private lastLat: number | null = null;
  private lastLng: number | null = null;
  private minDistanceMeters = 25; // Throttle small movements (PRD Sec 11)

  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Checks current permission status.
   */
  public async checkPermissions(): Promise<LocationPermissionState> {
    if (!('geolocation' in navigator)) {
      return {
        hasRequested: true,
        isGranted: false,
        isDenied: true,
        isServiceDisabled: true,
        errorMessage: 'Geolocation is not supported on this device/browser.',
      };
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return {
          hasRequested: status.state !== 'prompt',
          isGranted: status.state === 'granted',
          isDenied: status.state === 'denied',
          isServiceDisabled: false,
        };
      } catch {
        // Fall back to prompt state
      }
    }

    return {
      hasRequested: false,
      isGranted: false,
      isDenied: false,
      isServiceDisabled: false,
    };
  }

  private extractUserLoc(pos: GeolocationPosition): UserLocation {
    const { latitude, longitude, accuracy } = pos.coords;
    this.lastLat = latitude;
    this.lastLng = longitude;
    return {
      latitude,
      longitude,
      accuracyMeters: Math.round((accuracy || 10) * 10) / 10,
      capturedAt: pos.timestamp || Date.now(),
      receivedAt: Date.now(),
      platform: 'web',
      isSharing: true,
    };
  }

  /**
   * Starts location tracking.
   * On Native Android: Uses Capgo background geolocation with persistent notification.
   * On Web: Uses standard HTML5 Geolocation with automatic fallback from high accuracy to network positioning.
   */
  public async startTracking(
    onUpdate: LocationUpdateCallback,
    onError: LocationErrorCallback,
    forceRestart: boolean = false
  ): Promise<boolean> {
    if (this.isTracking && !forceRestart) {
      return true;
    }
    if (this.isTracking && forceRestart) {
      await this.stopTracking();
    }

    if (this.isNative() && BackgroundGeolocation) {
      try {
        const watcherId = await BackgroundGeolocation.addWatcher(
          {
            backgroundTitle: 'FriendFlow Location Sharing',
            backgroundMessage: 'Sharing live location with your accepted friends',
            requestPermissions: true,
            stale: false,
            distanceFilter: this.minDistanceMeters,
          },
          (location, error) => {
            if (error) {
              if (error.code === 'NOT_AUTHORIZED') {
                onError('Location permission denied. Please enable location permissions in app settings.');
              } else {
                onError(`Location tracking error: ${error.message || 'Unknown error'}`);
              }
              return;
            }

            if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
              const userLoc: UserLocation = {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracyMeters: location.accuracy || 10,
                capturedAt: location.time ? Math.round(location.time) : Date.now(),
                receivedAt: Date.now(),
                platform: 'android',
                isSharing: true,
              };

              this.lastLat = location.latitude;
              this.lastLng = location.longitude;
              onUpdate(userLoc);
            }
          }
        );

        this.activeWatcherId = watcherId;
        this.isTracking = true;
        return true;
      } catch (err: any) {
        console.error('[backgroundLocationService] Failed starting native watcher:', err);
        onError(err.message || 'Failed to start native background tracking.');
        return false;
      }
    } else {
      // Browser / Web fallback (foreground only as mandated by PRD)
      if (!('geolocation' in navigator)) {
        onError('Geolocation is not supported by your browser.');
        return false;
      }

      try {
        // 1. Immediate position acquisition with graceful fallback
        const tryGetCurrent = (highAccuracy: boolean) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              onUpdate(this.extractUserLoc(pos));
            },
            (err) => {
              if (highAccuracy) {
                console.warn('[LocationTrackingManager] High-accuracy query failed, falling back to network positioning:', err.message);
                tryGetCurrent(false);
              } else {
                let msg = 'Failed to obtain GPS coordinates.';
                if (err.code === err.PERMISSION_DENIED) {
                  msg = 'Location permission denied. Click the lock or tune icon beside the URL in your browser address bar and set Location to "Allow", then click Retry.';
                } else if (err.code === err.POSITION_UNAVAILABLE) {
                  msg = 'Device location unavailable. Ensure Location Services are turned ON in Windows Settings (Settings > Privacy & security > Location) and allowed for your browser.';
                } else if (err.code === err.TIMEOUT) {
                  msg = 'Location request timed out. Please check your network connection.';
                }
                onError(msg);
              }
            },
            {
              enableHighAccuracy: highAccuracy,
              timeout: highAccuracy ? 5000 : 12000,
              maximumAge: highAccuracy ? 5000 : 30000,
            }
          );
        };

        tryGetCurrent(true);

        // 2. Start ongoing watcher with auto-fallback to low accuracy if high fails
        let useHighAccuracy = true;
        const startWatcher = (highAcc: boolean): number => {
          return navigator.geolocation.watchPosition(
            (pos) => {
              onUpdate(this.extractUserLoc(pos));
            },
            (err) => {
              if (useHighAccuracy && (err.code === err.POSITION_UNAVAILABLE || err.code === err.TIMEOUT)) {
                console.warn('[LocationTrackingManager] Watcher high accuracy failed, switching to network positioning:', err.message);
                useHighAccuracy = false;
                if (typeof this.activeWatcherId === 'number') {
                  navigator.geolocation.clearWatch(this.activeWatcherId);
                }
                this.activeWatcherId = startWatcher(false);
                return;
              }

              let msg = 'Failed to obtain GPS coordinates.';
              if (err.code === err.PERMISSION_DENIED) {
                msg = 'Location permission denied. Click the lock icon in your browser address bar to Allow location access.';
              } else if (err.code === err.POSITION_UNAVAILABLE) {
                msg = 'Device location unavailable. Ensure Location is turned ON in Windows Settings (Settings > Privacy & security > Location).';
              } else if (err.code === err.TIMEOUT) {
                msg = 'Location request timed out. Retrying...';
              }
              onError(msg);
            },
            {
              enableHighAccuracy: highAcc,
              maximumAge: highAcc ? 5000 : 15000,
              timeout: highAcc ? 10000 : 20000,
            }
          );
        };

        const watchId = startWatcher(true);
        this.activeWatcherId = watchId;
        this.isTracking = true;
        return true;
      } catch (err: any) {
        onError(err.message || 'Unable to access browser geolocation.');
        return false;
      }
    }
  }

  /**
   * Stops tracking immediately and clears all listeners.
   */
  public async stopTracking(): Promise<void> {
    if (this.activeWatcherId !== null) {
      if (this.isNative() && BackgroundGeolocation) {
        try {
          await BackgroundGeolocation.removeWatcher({ id: String(this.activeWatcherId) });
        } catch (e) {
          console.warn('[backgroundLocationService] Error removing native watcher:', e);
        }
      } else if (typeof this.activeWatcherId === 'number') {
        navigator.geolocation.clearWatch(this.activeWatcherId);
      }
      this.activeWatcherId = null;
    }

    this.isTracking = false;
    this.lastLat = null;
    this.lastLng = null;
  }

  public getTrackingStatus(): boolean {
    return this.isTracking;
  }
}

export const locationTrackingManager = new LocationTrackingManager();
