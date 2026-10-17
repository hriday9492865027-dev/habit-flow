import React, { useState, useMemo } from 'react';
import { MapView } from '../components/MapView';
import { SharingStatus } from '../components/SharingStatus';
import { FriendCard } from '../components/FriendCard';
import { EmptyState } from '../components/EmptyState';
import { useLocation } from '../contexts/LocationContext';
import { useAcceptedFriends } from '../hooks/useAcceptedFriends';
import { useAuthorizedFriendLocations } from '../hooks/useAuthorizedFriendLocations';
import {
  Users,
  UserPlus,
  Compass,
  ArrowRightLeft,
  ChevronRight,
  ChevronLeft,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

interface DashboardPageProps {
  onGoFriends: () => void;
  onGoDistance: (friendUid?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onGoFriends,
  onGoDistance,
}) => {
  const { myLocation, isSharing } = useLocation();
  const { friends, loading: friendsLoading } = useAcceptedFriends();
  const { locations: friendLocations, loading: locationsLoading } =
    useAuthorizedFriendLocations(friends, myLocation);

  const [selectedFriendUid, setSelectedFriendUid] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter friends based on search and sharing state
  const displayedFriends = useMemo(() => {
    return friends.filter((friend) => {
      const matchesSearch =
        friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filterActiveOnly) {
        return Boolean(friendLocations[friend.uid]);
      }
      return true;
    });
  }, [friends, searchQuery, filterActiveOnly, friendLocations]);

  const activeSharingCount = Object.keys(friendLocations).length;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Primary Map Container */}
      <div className="flex-1 relative h-full">
        <MapView
          myLocation={myLocation}
          friendLocations={friendLocations}
          selectedFriendUid={selectedFriendUid}
          onSelectFriend={(uid) => {
            setSelectedFriendUid(uid);
            setSidebarOpen(true);
          }}
          className="rounded-none border-0"
        />

        {/* Floating Toggle Sidebar button for desktop */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-subtle border border-slate-200/80 text-slate-700 hover:text-[#167D70] transition-colors items-center gap-1.5 text-xs font-bold"
          title={sidebarOpen ? 'Collapse sidebar' : 'Open friends sidebar'}
        >
          {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <span>{sidebarOpen ? 'Hide Panel' : `Friends (${friends.length})`}</span>
        </button>

        {/* Mobile floating bottom sheet bar */}
        <div className="md:hidden absolute bottom-4 left-4 right-4 z-[400]">
          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-floating border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#167D70] animate-pulse"></span>
              <span className="text-xs font-bold text-[#123B35]">
                {activeSharingCount} {activeSharingCount === 1 ? 'friend' : 'friends'} sharing now
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onGoDistance()}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl flex items-center gap-1"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Compare</span>
              </button>
              <button
                onClick={onGoFriends}
                className="px-3 py-1.5 text-xs font-bold text-white bg-[#167D70] rounded-xl flex items-center gap-1"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Friends</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Collapsible Right Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-l border-slate-200 transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-96' : 'w-0 overflow-hidden border-l-0'
        }`}
      >
        <div className="p-4 border-b border-slate-100 space-y-3">
          <SharingStatus />

          {/* Search & Filter */}
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter friends..."
                className="w-full px-3 py-2 pl-8 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#167D70]/40"
              />
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            </div>

            <button
              onClick={() => setFilterActiveOnly(!filterActiveOnly)}
              className={`p-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                filterActiveOnly
                  ? 'bg-[#DDF5E9] text-[#123B35] border-[#167D70]/40'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Show only friends with active sharing"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Friends List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>
              ACCEPTED FRIENDS ({displayedFriends.length})
            </span>
            <button
              onClick={onGoFriends}
              className="text-[#167D70] hover:underline flex items-center gap-1 font-bold"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {friendsLoading ? (
            <div className="space-y-3 py-4">
              <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
              <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
            </div>
          ) : displayedFriends.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No friends found"
              description={
                searchQuery
                  ? 'No accepted friends match your search query.'
                  : 'Add friends to start sharing locations and comparing distances.'
              }
              actionLabel="Discover Friends"
              onAction={onGoFriends}
              className="py-6 border-0 shadow-none bg-slate-50/60"
            />
          ) : (
            displayedFriends.map((friend) => (
              <FriendCard
                key={friend.uid}
                friend={friend}
                location={friendLocations[friend.uid]}
                isSelected={selectedFriendUid === friend.uid}
                onSelect={() => setSelectedFriendUid(friend.uid)}
                onCompare={() => onGoDistance(friend.uid)}
              />
            ))
          )}
        </div>
      </aside>
    </div>
  );
};
