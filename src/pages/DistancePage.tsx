import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useAcceptedFriends } from '../hooks/useAcceptedFriends';
import { useAuthorizedFriendLocations } from '../hooks/useAuthorizedFriendLocations';
import { DistanceComparePanel } from '../components/DistanceComparePanel';
import { MapView } from '../components/MapView';
import { SharingStatus } from '../components/SharingStatus';
import { ArrowRightLeft, Info, MapPin } from 'lucide-react';

interface DistancePageProps {
  initialFriendUid?: string | null;
  onGoFriends?: () => void;
}

export const DistancePage: React.FC<DistancePageProps> = ({ initialFriendUid, onGoFriends }) => {
  const { currentUser } = useAuth();
  const { myLocation, isSharing, trackingError, startSharing, refreshLocation } = useLocation();
  const { friends } = useAcceptedFriends();
  const { locations: friendLocations } = useAuthorizedFriendLocations(friends, myLocation);

  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);

  const myFreshness = myLocation ? (isSharing ? 'live' : 'recent') : 'unavailable';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-[#123B35] tracking-tight">Distance Comparison</h1>
          <p className="text-xs text-slate-500 mt-1">
            Calculate straight-line Haversine distance and driving road routes between you and your friends.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <SharingStatus compact />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Calculator Control */}
        <div className="lg:col-span-5 space-y-6">
          <DistanceComparePanel
            myLocation={myLocation}
            myName={currentUser?.displayName || 'You'}
            myFreshness={myFreshness}
            friends={friends}
            friendLocations={friendLocations}
            initialFriendUid={initialFriendUid}
            onRouteCalculated={(geom) => setRouteGeometry(geom)}
            onGoFriends={onGoFriends}
            isSharing={isSharing}
            trackingError={trackingError}
            onStartSharing={startSharing}
            onRefreshLocation={refreshLocation}
          />

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle text-xs text-slate-600 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-[#123B35]">
              <Info className="w-4 h-4 text-[#167D70]" />
              <span>Straight-Line vs. Driving Distance</span>
            </div>
            <p className="leading-relaxed">
              <strong>Straight-line distance:</strong> Computed locally using the spherical Haversine
              formula based on coordinates in WGS84 ellipsoid.
            </p>
            <p className="leading-relaxed">
              <strong>Road distance:</strong> Calculated via Open Source Routing Machine (OSRM). Real-world
              travel distance is generally 20% to 50% longer than direct line-of-sight due to turns,
              topography, and road networks.
            </p>
          </div>
        </div>

        {/* Right: Map Route Visualizer */}
        <div className="lg:col-span-7 h-[550px] sticky top-24">
          <MapView
            myLocation={myLocation}
            friendLocations={friendLocations}
            routeGeometry={routeGeometry}
            className="h-full rounded-3xl"
          />
        </div>
      </div>
    </div>
  );
};
