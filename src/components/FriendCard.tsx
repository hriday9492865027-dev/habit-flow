import React, { useState } from 'react';
import { FriendContact, FriendLocationDisplay } from '../types';
import { MapPin, ArrowRightLeft, UserX, Clock, Navigation } from 'lucide-react';
import { formatRelativeTime } from '../lib/distance';

interface FriendCardProps {
  friend: FriendContact;
  location?: FriendLocationDisplay;
  isSelected?: boolean;
  onSelect?: () => void;
  onCompare?: () => void;
  onRemove?: () => void;
}

export const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  location,
  isSelected = false,
  onSelect,
  onCompare,
  onRemove,
}) => {
  const [confirmRemove, setConfirmRemove] = useState(false);

  const initials = (friend.displayName || friend.username || 'F')
    .substring(0, 2)
    .toUpperCase();

  const isLive = location?.freshness === 'live';
  const isRecent = location?.freshness === 'recent';
  const isStale = location?.freshness === 'stale';
  const isSharing = Boolean(location);

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isSelected
          ? 'bg-[#DDF5E9]/30 border-[#167D70] shadow-sm'
          : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-subtle'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-[#123B35] text-white flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                isLive
                  ? 'bg-[#10B981]'
                  : isRecent
                  ? 'bg-[#0284C7]'
                  : isStale
                  ? 'bg-[#F59E0B]'
                  : 'bg-slate-300'
              }`}
            />
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#123B35] leading-tight">
              {friend.displayName}
            </h4>
            <p className="text-xs text-slate-500">@{friend.username}</p>

            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                  isLive
                    ? 'bg-emerald-50 text-emerald-700'
                    : isRecent
                    ? 'bg-sky-50 text-sky-700'
                    : isStale
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {location ? location.freshness : 'Not sharing'}
              </span>

              {location && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(location.capturedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {location?.distanceFromMeKm !== undefined && (
          <div className="text-right shrink-0">
            <span className="text-xs font-semibold text-[#167D70] block">
              {location.distanceFromMeKm < 1
                ? `${Math.round(location.distanceFromMeKm * 1000)} m`
                : `${location.distanceFromMeKm.toFixed(1)} km`}
            </span>
            <span className="text-[10px] text-slate-400">away</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between border-t border-slate-100 mt-3 pt-3 gap-2">
        <div className="flex items-center gap-2">
          {location && onSelect && (
            <button
              onClick={onSelect}
              className="px-2.5 py-1.5 text-xs font-medium text-[#167D70] hover:bg-[#DDF5E9]/50 rounded-xl transition-colors flex items-center gap-1.5"
              title="Focus on map"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          )}

          {location && onCompare && (
            <button
              onClick={onCompare}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-[#123B35] hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
              title="Compare distance and ETA"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Distance</span>
            </button>
          )}
        </div>

        {onRemove && (
          <div>
            {confirmRemove ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    onRemove();
                    setConfirmRemove(false);
                  }}
                  className="px-2 py-1 text-[11px] font-semibold text-white bg-[#C43D4B] hover:bg-red-700 rounded-lg"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmRemove(false)}
                  className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRemove(true)}
                className="p-1.5 text-slate-400 hover:text-[#C43D4B] hover:bg-red-50 rounded-lg transition-colors"
                title="Remove friend"
              >
                <UserX className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
