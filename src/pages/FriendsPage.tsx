import React, { useState } from 'react';
import { useAcceptedFriends } from '../hooks/useAcceptedFriends';
import { useFriendRequests } from '../hooks/useFriendRequests';
import { FriendSearch } from '../components/FriendSearch';
import { FriendRequestList } from '../components/FriendRequestList';
import { FriendCard } from '../components/FriendCard';
import { EmptyState } from '../components/EmptyState';
import { Users, UserPlus, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import { useAuthorizedFriendLocations } from '../hooks/useAuthorizedFriendLocations';

interface FriendsPageProps {
  onGoDistance: (friendUid?: string) => void;
  onGoDashboard: () => void;
}

export const FriendsPage: React.FC<FriendsPageProps> = ({
  onGoDistance,
  onGoDashboard,
}) => {
  const { friends, loading: friendsLoading } = useAcceptedFriends();
  const {
    sentRequests,
    receivedRequests,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriend,
    actionError,
  } = useFriendRequests();
  const { myLocation } = useLocation();
  const { locations: friendLocations } = useAuthorizedFriendLocations(friends, myLocation);

  const [notification, setNotification] = useState<string | null>(null);

  const handleSendRequest = async (target: any) => {
    await sendRequest(target);
    setNotification(`Friend request sent to @${target.username}.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAccept = async (req: any) => {
    await acceptRequest(req);
    setNotification(`You are now friends with ${req.fromDisplayName}!`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRemoveFriend = async (friendUid: string) => {
    await removeFriend(friendUid);
    setNotification('Friend removed. Location sharing access revoked.');
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-[#123B35] tracking-tight">Friends &amp; Connections</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your trusted circle. Only accepted friends can view your shared location.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 shadow-subtle">
            Total Friends: <span className="text-[#167D70] font-bold">{friends.length}</span>
          </div>
          <button
            onClick={onGoDashboard}
            className="px-4 py-2 text-xs font-bold text-white bg-[#167D70] hover:bg-[#12675C] rounded-xl shadow-sm transition-all"
          >
            View on Map
          </button>
        </div>
      </div>

      {/* Notifications / Errors */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#C43D4B] flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Discover and Requests */}
        <div className="space-y-6 lg:col-span-1">
          <FriendSearch
            friends={friends}
            sentRequests={sentRequests}
            onSendRequest={handleSendRequest}
          />

          <FriendRequestList
            receivedRequests={receivedRequests}
            sentRequests={sentRequests}
            onAccept={handleAccept}
            onReject={rejectRequest}
            onCancel={cancelRequest}
          />
        </div>

        {/* Right column: Accepted Friends List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#123B35]">Your Friends ({friends.length})</h2>
            <span className="text-xs text-slate-400">
              {Object.keys(friendLocations).length} active now
            </span>
          </div>

          {friendsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
              <div className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            </div>
          ) : friends.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No friends yet"
              description="Search by username on the left to send your first friend request."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.map((friend) => (
                <FriendCard
                  key={friend.uid}
                  friend={friend}
                  location={friendLocations[friend.uid]}
                  onSelect={onGoDashboard}
                  onCompare={() => onGoDistance(friend.uid)}
                  onRemove={() => handleRemoveFriend(friend.uid)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
