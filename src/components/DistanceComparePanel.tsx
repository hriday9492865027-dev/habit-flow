import React, { useState, useMemo } from 'react';
import { ArrowRightLeft, Car, Ruler, AlertCircle, Clock, Info } from 'lucide-react';
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
}

export const DistanceComparePanel: React.FC<DistanceComparePanelProps> = ({
  myLocation,
  myName,
  myFreshness,
  friends,
  friendLocations,
  initialFriendUid,
  onRouteCalculated,
}) => {
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
  React.useEffect(() => {
    if (onRouteCalculated) {
      onRouteCalculated(distanceState.roadGeometry);
    }
  }, [distanceState.roadGeometry, onRouteCalculated]);

  const handleSwap = () => {
    const temp = selectedIdA;
    setSelectedIdA(selectedIdB);
    setSelectedIdB(temp);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-6 shadow-subtle space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#123B35]">Distance & Route Calculator</h3>
          <p className="text-xs text-slate-500">
            Compare straight-line Haversine distance and driving ETA between two locations.
          </p>
        </div>
      </div>

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
      {distanceState.warningMessage && (
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
            {selectedIdA === selectedIdB
              ? 'Please select two different friends to compare distance.'
              : 'Both selected people must have active location sharing enabled with GPS coordinates.'}
          </p>
        </div>
      )}
    </div>
  );
};
