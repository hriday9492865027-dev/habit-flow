import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Check, Clock, AlertCircle } from 'lucide-react';
import { profileService, PublicUserResult } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';
import { FriendContact, FriendRequest } from '../types';

interface FriendSearchProps {
  friends: FriendContact[];
  sentRequests: FriendRequest[];
  onSendRequest: (target: PublicUserResult) => Promise<void>;
}

export const FriendSearch: React.FC<FriendSearchProps> = ({
  friends,
  sentRequests,
  onSendRequest,
}) => {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicUserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [requestStatus, setRequestStatus] = useState<Record<string, 'sending' | 'sent' | 'error'>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setErrorMessage(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setErrorMessage(null);
      try {
        if (!currentUser) return;
        const res = await profileService.searchUsersByUsername(trimmed, currentUser.uid);
        setResults(res);
      } catch (err: any) {
        setErrorMessage(err.message || 'Error searching users.');
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentUser]);

  const handleAddClick = async (target: PublicUserResult) => {
    setRequestStatus((prev) => ({ ...prev, [target.uid]: 'sending' }));
    try {
      await onSendRequest(target);
      setRequestStatus((prev) => ({ ...prev, [target.uid]: 'sent' }));
    } catch (err: any) {
      setRequestStatus((prev) => ({ ...prev, [target.uid]: 'error' }));
      setErrorMessage(err.message || 'Failed to send request.');
    }
  };

  const isAlreadyFriend = (uid: string) => friends.some((f) => f.uid === uid);
  const isAlreadySent = (uid: string) =>
    sentRequests.some((r) => r.toUid === uid && r.status === 'pending');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-subtle">
      <div className="flex items-center gap-2 mb-3">
        <Search className="w-4 h-4 text-[#167D70]" />
        <h3 className="text-sm font-bold text-[#123B35]">Discover Friends</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Search for friends by username to connect and share your live location.
      </p>

      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username (e.g. alex, sarah)..."
          className="w-full px-4 py-2.5 pl-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#167D70]/40 focus:border-[#167D70] transition-all"
        />
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        {searching && (
          <span className="absolute right-3.5 top-3 w-4 h-4 border-2 border-[#167D70]/30 border-t-[#167D70] rounded-full animate-spin" />
        )}
      </div>

      {errorMessage && (
        <div className="p-3 mb-3 text-xs text-[#C43D4B] bg-red-50 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
          {results.map((user) => {
            const alreadyFriend = isAlreadyFriend(user.uid);
            const requestPending = isAlreadySent(user.uid) || requestStatus[user.uid] === 'sent';
            const isSending = requestStatus[user.uid] === 'sending';

            return (
              <div
                key={user.uid}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#123B35] text-white flex items-center justify-center font-bold text-xs">
                    {user.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#123B35]">{user.displayName}</h4>
                    <p className="text-[11px] text-slate-500">@{user.username}</p>
                  </div>
                </div>

                <div>
                  {alreadyFriend ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Friends
                    </span>
                  ) : requestPending ? (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Request Sent
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddClick(user)}
                      disabled={isSending}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-[#167D70] hover:bg-[#12675C] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {isSending ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {query.trim().length >= 2 && !searching && results.length === 0 && !errorMessage && (
        <p className="text-xs text-slate-400 text-center py-3">
          No users found matching &quot;{query}&quot;.
        </p>
      )}
    </div>
  );
};
