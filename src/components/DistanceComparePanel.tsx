import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowRightLeft,
  Car,
  Ruler,
  AlertCircle,
  Clock,
  Info,
  Users,
  UserPlus,
  Radio,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { UserLocation, FriendContact, FriendLocationDisplay } from '../types';
import { useTwoFriendDistance, EntityLocationInfo } from '../hooks/useTwoFriendDistance';

interface DistanceComparePanelProps {
  myLocation: UserLocation | null;
  myName: string;
  myFreshness: 'live' | 'recent' | 'stale' | 'offline' | 'unavailable';
  friends: FriendContact[];
  friendLocations: Record<string, FriendLocationDisplay>;
  initialFriendUid?: string | null;
  onRouteCalculated?: (geometry: [number, number][] | null) => void;
  onGoFriends?: () => void;
  isSharing?: boolean;
  trackingError?: string | null;
  onStartSharing?: () => Promise<boolean>;
  onRefreshLocation?: () => Promise<boolean>;
}

export const DistanceComparePanel: React.FC<DistanceComparePanelProps> = ({
  myLocation,
  myName,
  myFreshness,
  friends,
  friendLocations,
  initialFriendUid,
  onRouteCalculated,
  onGoFriends,
  isSharing = false,
  trackingError,
  onStartSharing,
  onRefreshLocation,
}) => {
  const [retrying, setRetrying] = useState(false);

  // Candidate list includes "Me" + friends
  const candidates: EntityLocationInfo[] = useMemo(() => {
    const list: EntityLocationInfo[] = [
      {
        id: 'me',
        name: `You (${myName})`,
        location: myLocation,
        freshness: myFreshness,
      },
    ];

    friends.forEach((f) => {
      const loc = friendLocations[f.uid];
      list.push({
        id: f.uid,
        name: `${f.displayName} (@${f.username})`,
        location: loc ? { ...loc } : null,
        freshness: loc ? loc.freshness : 'unavailable',
      });
    });

    return list;
  }, [myLocation, myName, myFreshness, friends, friendLocations]);

  const [selectedIdA, setSelectedIdA] = useState<string>('me');
  const [selectedIdB, setSelectedIdB] = useState<string>(
    initialFriendUid || (friends.length > 0 ? friends[0].uid : 'me')
  );

  // Auto-select first friend for destination when friends list loads
  useEffect(() => {
    if (selectedIdB === 'me' && friends.length > 0 && !initialFriendUid) {
      setSelectedIdB(friends[0].uid);
    }
  }, [friends, initialFriendUid, selectedIdB]);

  const entityA = useMemo(
    () => candidates.find((c) => c.id === selectedIdA) || null,
    [candidates, selectedIdA]
  );
  const entityB = useMemo(
    () => candidates.find((c) => c.id === selectedIdB) || null,
    [candidates, selectedIdB]
  );

  const distanceState = useTwoFriendDistance(entityA, entityB);

  // Sync geometry to parent MapView when available
  useEffect(() => {
    if (onRouteCalculated) {
      onRouteCalculated(distanceState.roadGeometry);
    }
  }, [distanceState.roadGeometry, onRouteCalculated]);

  const handleSwap = () => {
    const temp = selectedIdA;
    setSelectedIdA(selectedIdB);
    setSelectedIdB(temp);
  };

  const handleRetryLocation = async () => {
    if (onRefreshLocation) {
      setRetrying(true);
      try {
        await onRefreshLocation();
      } finally {
        setTimeout(() => setRetrying(false), 800);
      }
    }
  };

  const hasNoFriends = friends.length === 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-6 shadow-subtle space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#123B35]">Distance &amp; Route Calculator</h3>
          <p className="text-xs text-slate-500">
            Compare straight-line Haversine distance and driving ETA between two locations.
          </p>
        </div>
      </div>

      {/* When user has no friends yet: Show a clear guidance card */}
      {hasNoFriends && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-950">
            <Users className="w-4 h-4 text-amber-700 shrink-0" />
            <span>No Friends Connected Yet</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Distance calculation measures the route between <strong>two different people</strong>. To compare distance, add a friend in the Friends tab and have them accept.
          </p>
          {onGoFriends && (
            <button
              onClick={onGoFriends}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#167D70] hover:bg-[#12675C] text-white text-xs font-bold transition-all shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Go to Friends Tab</span>
            </button>
          )}
        </div>
      )}

      {/* Location Status / Diagnostics Box */}
      {!myLocation && (
        <div className="p-4 rounded-2xl border text-xs space-y-2.5 transition-all bg-slate-50 border-slate-200">
          {!isSharing ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-slate-700">
                <Radio className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block">Location Sharing is Disabled</span>
                  <span className="text-slate-500 text-[11px]">
                    Turn on location sharing to acquire your coordinates and compare distance with friends.
                  </span>
                </div>
              </div>
              {onStartSharing && (
                <button
                  onClick={() => onStartSharing()}
                  className="px-3.5 py-1.5 rounded-xl bg-[#167D70] hover:bg-[#12675C] text-white text-xs font-bold whitespace-nowrap self-start sm:self-center shadow-sm"
                >
                  Enable Sharing
                </button>
              )}
            </div>
          ) : trackingError ? (
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-red-800 bg-red-50/60 p-2.5 rounded-xl border border-red-200/60">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block">GPS Acquisition Notice</span>
                  <span className="text-[11px] leading-tight text-red-700">{trackingError}</span>
                </div>
              </div>
              {onRefreshLocation && (
                <button
                  onClick={handleRetryLocation}
                  disabled={retrying}
                  className="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold whitespace-nowrap self-start sm:self-center flex items-center gap-1 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                  <span>Retry</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-sky-800 bg-sky-50/80 p-2.5 rounded-xl border border-sky-200/60">
              <span className="w-4 h-4 border-2 border-sky-600/30 border-t-sky-600 rounded-full animate-spin shrink-0" />
              <div>
                <span className="font-bold block">Acquiring coordinates...</span>
                <span className="text-[11px] text-sky-700">
                  Requesting GPS/network position from browser. If prompted, please allow location access.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selectors and Swap Button */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-3 items-center">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Origin (Point A)</label>
          <select
            value={selectedIdA}
            onChange={(e) => setSelectedIdA(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#167D70]/40 font-medium text-slate-800"
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.location ? '' : '(No GPS)'}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSwap}
          className="self-center justify-self-center p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors mt-4 sm:mt-5"
          title="Swap origin and destination"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Destination (Point B)</label>
          <select
            value={selectedIdB}
            onChange={(e) => setSelectedIdB(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#167D70]/40 font-medium text-slate-800"
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.location ? '' : '(No GPS)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Warnings & Messages */}
      {distanceState.warningMessage && !hasNoFriends && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <span>{distanceState.warningMessage}</span>
        </div>
      )}

      {/* Distance Cards Display */}
      {distanceState.hasBothCoordinates ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Straight line Haversine Card */}
          <div className="p-4 rounded-2xl bg-[#F7F8F5] border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs font-bold text-[#167D70] mb-2">
              <Ruler className="w-4 h-4" />
              <span>Straight-Line Distance</span>
            </div>
            <div className="text-2xl font-black text-[#123B35] tracking-tight">
              {distanceState.formattedHaversine}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Calculated via client-side Haversine formula
            </p>
          </div>

          {/* Road Distance & ETA Card */}
          <div className="p-4 rounded-2xl bg-[#F7F8F5] border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 mb-2">
              <Car className="w-4 h-4" />
              <span>Road Distance &amp; Driving ETA</span>
            </div>

            {distanceState.isCalculatingRoad ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                <span className="w-4 h-4 border-2 border-sky-600/30 border-t-sky-600 rounded-full animate-spin" />
                <span>Querying OSRM driving route...</span>
              </div>
            ) : distanceState.roadDistanceKm !== null ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#123B35] tracking-tight">
                    {distanceState.roadDistanceKm} km
                  </span>
                  {distanceState.roadDurationMinutes !== null && (
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      ~{distanceState.roadDurationMinutes} mins
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Estimated via Open Source Routing Machine
                </p>
              </>
            ) : (
              <div className="text-xs text-slate-500 py-1">
                <p className="text-slate-600 font-medium">Road routing unavailable</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {distanceState.roadError || 'No road route found. Showing straight-line distance.'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
          <Info className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500">
            {hasNoFriends
              ? 'Connect with a friend in the Friends tab to start calculating distances.'
              : selectedIdA === selectedIdB
              ? 'Please select two different friends to compare distance.'
              : 'Both selected people must have active location sharing enabled with GPS coordinates.'}
          </p>
        </div>
      )}
    </div>
  );
};
