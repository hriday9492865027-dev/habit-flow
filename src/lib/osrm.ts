import { isValidCoordinate } from './distance';

export interface OsrmRouteResponse {
  success: boolean;
  roadDistanceKm?: number;
  roadDurationMinutes?: number;
  geometry?: [number, number][]; // Array of [lat, lng] for Leaflet Polyline
  errorMessage?: string;
  source: 'osrm' | 'fallback';
}

const DEFAULT_OSRM_ENDPOINT = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Fetches driving route between two points from OSRM.
 * Fails gracefully with a clear error message if service is rate-limited, offline, or unavailable.
 */
export async function fetchRoadRoute(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  timeoutMs: number = 7000
): Promise<OsrmRouteResponse> {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return {
      success: false,
      source: 'fallback',
      errorMessage: 'Invalid coordinates provided for route calculation.',
    };
  }

  const endpoint = import.meta.env.VITE_OSRM_ROUTING_URL || DEFAULT_OSRM_ENDPOINT;
  // OSRM expects coordinates in {lon},{lat};{lon},{lat} order
  const url = `${endpoint}/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 429) {
        return {
          success: false,
          source: 'fallback',
          errorMessage: 'OSRM public demo rate limit reached. Using straight-line distance.',
        };
      }
      return {
        success: false,
        source: 'fallback',
        errorMessage: `Routing service returned status ${res.status}. Falling back to straight-line distance.`,
      };
    }

    const data = await res.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return {
        success: false,
        source: 'fallback',
        errorMessage: data.message || 'No driving route found between these locations.',
      };
    }

    const primaryRoute = data.routes[0];
    const distanceMeters = primaryRoute.distance;
    const durationSeconds = primaryRoute.duration;

    // Convert GeoJSON [lon, lat] coordinates to Leaflet [lat, lon]
    let coordinates: [number, number][] | undefined;
    if (primaryRoute.geometry && Array.isArray(primaryRoute.geometry.coordinates)) {
      coordinates = primaryRoute.geometry.coordinates.map(
        ([lon, lat]: [number, number]) => [lat, lon] as [number, number]
      );
    }

    return {
      success: true,
      source: 'osrm',
      roadDistanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      roadDurationMinutes: Math.round(durationSeconds / 60),
      geometry: coordinates,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isAbort = err.name === 'AbortError';
    return {
      success: false,
      source: 'fallback',
      errorMessage: isAbort
        ? 'Routing service request timed out. Showing straight-line distance.'
        : 'Network error contacting routing service. Showing straight-line distance.',
    };
  }
}
