import { useState, useEffect } from 'react';
import { UserLocation, FreshnessStatus } from '../types';
import {
  calculateHaversineDistanceMeters,
  formatDistance,
  metersToKilometers,
  isValidCoordinate,
} from '../lib/distance';
import { fetchRoadRoute } from '../lib/osrm';

export interface EntityLocationInfo {
  id: string;
  name: string;
  location?: UserLocation | null;
  freshness: FreshnessStatus;
}

export interface TwoFriendDistanceState {
  hasBothCoordinates: boolean;
  haversineMeters: number | null;
  haversineKm: number | null;
  formattedHaversine: string;
  roadDistanceKm: number | null;
  roadDurationMinutes: number | null;
  roadGeometry: [number, number][] | null;
  isCalculatingRoad: boolean;
  roadError: string | null;
  isStaleWarning: boolean;
  warningMessage: string | null;
}

export function useTwoFriendDistance(
  entityA: EntityLocationInfo | null,
  entityB: EntityLocationInfo | null
): TwoFriendDistanceState {
  const [state, setState] = useState<TwoFriendDistanceState>({
    hasBothCoordinates: false,
    haversineMeters: null,
    haversineKm: null,
    formattedHaversine: '—',
    roadDistanceKm: null,
    roadDurationMinutes: null,
    roadGeometry: null,
    isCalculatingRoad: false,
    roadError: null,
    isStaleWarning: false,
    warningMessage: null,
  });

  useEffect(() => {
    if (
      !entityA?.location ||
      !entityB?.location ||
      !isValidCoordinate(entityA.location.latitude, entityA.location.longitude) ||
      !isValidCoordinate(entityB.location.latitude, entityB.location.longitude)
    ) {
      const missingName = !entityA?.location ? entityA?.name : entityB?.name;
      setState({
        hasBothCoordinates: false,
        haversineMeters: null,
        haversineKm: null,
        formattedHaversine: '—',
        roadDistanceKm: null,
        roadDurationMinutes: null,
        roadGeometry: null,
        isCalculatingRoad: false,
        roadError: null,
        isStaleWarning: false,
        warningMessage: missingName
          ? `${missingName}'s location is currently unavailable or sharing is turned off.`
          : 'Select two friends with active location sharing to calculate distance.',
      });
      return;
    }

    const locA = entityA.location;
    const locB = entityB.location;

    // Check freshness warning
    const isStale =
      entityA.freshness === 'stale' ||
      entityB.freshness === 'stale' ||
      entityA.freshness === 'offline' ||
      entityB.freshness === 'offline';

    let warningMessage: string | null = null;
    if (isStale) {
      const staleName = entityA.freshness === 'stale' ? entityA.name : entityB.name;
      warningMessage = `Notice: ${staleName}'s location is not live (last updated over 15 mins ago). Distance calculation is based on their last known coordinates.`;
    }

    // 1. Calculate client-side Haversine straight-line distance
    try {
      const meters = calculateHaversineDistanceMeters(
        locA.latitude,
        locA.longitude,
        locB.latitude,
        locB.longitude
      );
      const km = metersToKilometers(meters);
      const formatted = formatDistance(meters);

      setState((prev) => ({
        ...prev,
        hasBothCoordinates: true,
        haversineMeters: meters,
        haversineKm: km,
        formattedHaversine: formatted,
        isCalculatingRoad: true,
        roadError: null,
        isStaleWarning: isStale,
        warningMessage,
      }));

      // 2. Fetch driving road distance and ETA from OSRM
      let isMounted = true;
      fetchRoadRoute(locA.latitude, locA.longitude, locB.latitude, locB.longitude).then(
        (res) => {
          if (!isMounted) return;
          if (res.success && res.roadDistanceKm !== undefined) {
            setState((prev) => ({
              ...prev,
              roadDistanceKm: res.roadDistanceKm ?? null,
              roadDurationMinutes: res.roadDurationMinutes ?? null,
              roadGeometry: res.geometry ?? null,
              isCalculatingRoad: false,
              roadError: null,
            }));
          } else {
            setState((prev) => ({
              ...prev,
              roadDistanceKm: null,
              roadDurationMinutes: null,
              roadGeometry: null,
              isCalculatingRoad: false,
              roadError: res.errorMessage || 'Driving route unavailable.',
            }));
          }
        }
      );

      return () => {
        isMounted = false;
      };
    } catch (e: any) {
      setState({
        hasBothCoordinates: false,
        haversineMeters: null,
        haversineKm: null,
        formattedHaversine: '—',
        roadDistanceKm: null,
        roadDurationMinutes: null,
        roadGeometry: null,
        isCalculatingRoad: false,
        roadError: null,
        isStaleWarning: false,
        warningMessage: 'Failed to calculate distance for these coordinates.',
      });
    }
  }, [
    entityA?.id,
    entityA?.location?.latitude,
    entityA?.location?.longitude,
    entityA?.freshness,
    entityB?.id,
    entityB?.location?.latitude,
    entityB?.location?.longitude,
    entityB?.freshness,
  ]);

  return state;
}
