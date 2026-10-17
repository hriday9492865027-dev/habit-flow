import React, { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { UserLocation, FriendLocationDisplay } from '../types';
import { formatRelativeTime } from '../lib/distance';
import { Navigation, Compass, AlertCircle } from 'lucide-react';

interface MapViewProps {
  myLocation: UserLocation | null;
  friendLocations: Record<string, FriendLocationDisplay>;
  routeGeometry?: [number, number][] | null;
  selectedFriendUid?: string | null;
  onSelectFriend?: (friendUid: string) => void;
  className?: string;
}

// Controller to smoothly fly to positions or fit bounds
function MapController({
  myLocation,
  friendLocations,
  routeGeometry,
  selectedFriendUid,
}: {
  myLocation: UserLocation | null;
  friendLocations: Record<string, FriendLocationDisplay>;
  routeGeometry?: [number, number][] | null;
  selectedFriendUid?: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    // If route exists, fit route bounds
    if (routeGeometry && routeGeometry.length > 1) {
      const bounds = L.latLngBounds(routeGeometry);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      return;
    }

    // If specific friend selected, fly to friend
    if (selectedFriendUid && friendLocations[selectedFriendUid]) {
      const f = friendLocations[selectedFriendUid];
      map.flyTo([f.latitude, f.longitude], 15, { animate: true, duration: 1 });
      return;
    }

    // Collect all valid points
    const points: [number, number][] = [];
    if (myLocation) {
      points.push([myLocation.latitude, myLocation.longitude]);
    }
    Object.values(friendLocations).forEach((fl) => {
      points.push([fl.latitude, fl.longitude]);
    });

    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    } else if (points.length === 1) {
      map.flyTo(points[0], 14, { animate: true });
    }
  }, [map, myLocation, friendLocations, routeGeometry, selectedFriendUid]);

  return null;
}

// Custom DivIcon creator for current user
function createUserMarkerIcon(isSharing: boolean = true) {
  const pulseColor = isSharing ? 'rgba(22, 125, 112, 0.25)' : 'rgba(100, 116, 139, 0.15)';
  const centerColor = isSharing ? '#167D70' : '#475569';
  const dotColor = isSharing ? '#DDF5E9' : '#F1F5F9';

  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
        <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: ${pulseColor}; ${isSharing ? 'animation: beaconPulse 2s infinite ease-in-out;' : ''}"></div>
        <div style="width: 22px; height: 22px; border-radius: 50%; background: ${centerColor}; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: ${dotColor};"></div>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

// Custom DivIcon creator for friends
function createFriendMarkerIcon(friend: FriendLocationDisplay, isSelected: boolean) {
  const initials = (friend.displayName || friend.username || 'F')
    .substring(0, 2)
    .toUpperCase();

  let badgeColor = '#10B981'; // live
  if (friend.freshness === 'recent') badgeColor = '#0284C7';
  if (friend.freshness === 'stale') badgeColor = '#F59E0B';
  if (friend.freshness === 'offline' || friend.freshness === 'unavailable') badgeColor = '#64748B';

  const borderColor = isSelected ? '#123B35' : '#ffffff';
  const borderWidth = isSelected ? '3px' : '2px';

  return L.divIcon({
    className: 'custom-friend-marker',
    html: `
      <div style="position: relative; width: 42px; height: 42px; cursor: pointer; transition: transform 0.2s;">
        <div style="width: 40px; height: 40px; border-radius: 50%; background: #123B35; border: ${borderWidth} solid ${borderColor}; box-shadow: 0 4px 10px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 13px; font-weight: 700; font-family: Inter, sans-serif;">
          ${initials}
        </div>
        <div style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border-radius: 50%; background: ${badgeColor}; border: 2px solid #ffffff;"></div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21],
  });
}

export const MapView: React.FC<MapViewProps> = ({
  myLocation,
  friendLocations,
  routeGeometry,
  selectedFriendUid,
  onSelectFriend,
  className = '',
}) => {
  const tileUrl =
    import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution =
    import.meta.env.VITE_MAP_ATTRIBUTION ||
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

  // Default initial center if no coordinates available (Neutral default)
  const defaultCenter: [number, number] = useMemo(() => {
    if (myLocation) return [myLocation.latitude, myLocation.longitude];
    const friends = Object.values(friendLocations);
    if (friends.length > 0) return [friends[0].latitude, friends[0].longitude];
    return [20.5937, 78.9629]; // Neutral world/subcontinent overview
  }, [myLocation, friendLocations]);

  const userMarkerIcon = useMemo(
    () => createUserMarkerIcon(myLocation?.isSharing ?? false),
    [myLocation?.isSharing]
  );

  return (
    <div className={`relative w-full h-full rounded-2xl overflow-hidden shadow-card border border-slate-200/80 ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={myLocation || Object.keys(friendLocations).length > 0 ? 13 : 4}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer url={tileUrl} attribution={attribution} />

        <MapController
          myLocation={myLocation}
          friendLocations={friendLocations}
          routeGeometry={routeGeometry}
          selectedFriendUid={selectedFriendUid}
        />

        {/* Current user marker */}
        {myLocation && (
          <Marker position={[myLocation.latitude, myLocation.longitude]} icon={userMarkerIcon}>
            <Popup>
              <div className="p-3 text-left min-w-[180px]">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      myLocation.isSharing ? 'bg-[#167D70]' : 'bg-slate-400'
                    }`}
                  ></div>
                  <span className="font-bold text-[#123B35] text-sm">Your Location</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      myLocation.isSharing
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {myLocation.isSharing ? 'Sharing Active' : 'Private'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 space-y-0.5">
                  <p>Accuracy: ~{Math.round(myLocation.accuracyMeters)}m</p>
                  <p>Updated: {formatRelativeTime(myLocation.capturedAt)}</p>
                  <p className="capitalize">Source: {myLocation.platform} GPS</p>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Friends' markers */}
        {Object.values(friendLocations).map((friend) => (
          <Marker
            key={friend.friendUid}
            position={[friend.latitude, friend.longitude]}
            icon={createFriendMarkerIcon(friend, selectedFriendUid === friend.friendUid)}
            eventHandlers={{
              click: () => {
                if (onSelectFriend) onSelectFriend(friend.friendUid);
              },
            }}
          >
            <Popup>
              <div className="p-3 text-left min-w-[200px]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-[#123B35] text-sm">{friend.displayName}</h4>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      friend.freshness === 'live'
                        ? 'bg-emerald-100 text-emerald-800'
                        : friend.freshness === 'recent'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {friend.freshness}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">@{friend.username}</p>
                <div className="text-xs text-slate-600 space-y-0.5 border-t border-slate-100 pt-1.5">
                  <p>
                    <span className="text-slate-400">Last Seen:</span>{' '}
                    {formatRelativeTime(friend.capturedAt)}
                  </p>
                  <p>
                    <span className="text-slate-400">Accuracy:</span> ~{Math.round(friend.accuracyMeters)}m
                  </p>
                  {friend.distanceFromMeKm !== undefined && (
                    <p className="font-medium text-[#167D70]">
                      <span className="text-slate-400">Distance:</span> ~{friend.distanceFromMeKm.toFixed(2)} km
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route polyline if available */}
        {routeGeometry && routeGeometry.length > 1 && (
          <Polyline
            positions={routeGeometry}
            color="#167D70"
            weight={4}
            opacity={0.8}
            dashArray="8, 6"
          />
        )}
      </MapContainer>

      {/* Freshness / Status Legend in bottom left */}
      <div className="absolute bottom-6 left-4 z-[400] bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-200/80 shadow-subtle text-[11px] text-slate-600 hidden sm:flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
          <span>Live (&lt;2m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]"></span>
          <span>Recent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
          <span>Stale</span>
        </div>
      </div>
    </div>
  );
};
