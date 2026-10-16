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

  /**
   * Starts location tracking.
   * On Native Android: Uses Capgo background geolocation with persistent notification.
   * On Web: Uses standard HTML5 Geolocation watchPosition in foreground.
   */
  public async startTracking(
    onUpdate: LocationUpdateCallback,
    onError: LocationErrorCallback
  ): Promise<boolean> {
    if (this.isTracking) {
      console.warn('[LocationTrackingManager] Tracking is already active.');
      return true;
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
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;

            // Throttle GPS jitter if moved less than distance threshold
            if (this.lastLat !== null && this.lastLng !== null) {
              const deltaLat = Math.abs(latitude - this.lastLat);
              const deltaLng = Math.abs(longitude - this.lastLng);
              // ~0.0002 degrees is roughly 22 meters
              if (deltaLat < 0.0002 && deltaLng < 0.0002) {
                return;
              }
            }

            this.lastLat = latitude;
            this.lastLng = longitude;

            const userLoc: UserLocation = {
              latitude,
              longitude,
              accuracyMeters: Math.round((accuracy || 10) * 10) / 10,
              capturedAt: pos.timestamp || Date.now(),
              receivedAt: Date.now(),
              platform: 'web',
              isSharing: true,
            };

            onUpdate(userLoc);
          },
          (err) => {
            let msg = 'Failed to obtain GPS coordinates.';
            if (err.code === err.PERMISSION_DENIED) {
              msg = 'Location permission denied. Please allow location access to share your location.';
            } else if (err.code === err.POSITION_UNAVAILABLE) {
              msg = 'Location unavailable. Ensure GPS is enabled on your device.';
            } else if (err.code === err.TIMEOUT) {
              msg = 'Location request timed out. Retrying...';
            }
            onError(msg);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 20000,
          }
        );

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
