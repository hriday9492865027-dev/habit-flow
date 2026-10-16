import React, { useState } from 'react';
import { Check, X, Clock, UserCheck, Inbox } from 'lucide-react';
import { FriendRequest } from '../types';
import { formatRelativeTime } from '../lib/distance';

interface FriendRequestListProps {
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  onAccept: (request: FriendRequest) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
  onCancel: (requestId: string) => Promise<void>;
}

export const FriendRequestList: React.FC<FriendRequestListProps> = ({
  receivedRequests,
  sentRequests,
  onAccept,
  onReject,
  onCancel,
}) => {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<void>, id: string) => {
    setProcessingId(id);
    try {
      await action();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-subtle">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
        <button
          onClick={() => setTab('received')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
            tab === 'received'
              ? 'bg-[#DDF5E9] text-[#123B35]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Received</span>
          {receivedRequests.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#167D70] text-white text-[10px] flex items-center justify-center font-bold">
              {receivedRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('sent')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
            tab === 'sent'
              ? 'bg-[#DDF5E9] text-[#123B35]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Sent</span>
          {sentRequests.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
              {sentRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {tab === 'received' && (
        <div className="space-y-3">
          {receivedRequests.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No pending received requests.</p>
          ) : (
            receivedRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#123B35] text-white flex items-center justify-center font-bold text-xs">
                    {(req.fromDisplayName || req.fromUsername || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#123B35]">{req.fromDisplayName}</h4>
                    <p className="text-[11px] text-slate-500">@{req.fromUsername}</p>
                    <span className="text-[10px] text-slate-400">
                      {formatRelativeTime(req.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAction(() => onAccept(req), req.id)}
                    disabled={processingId === req.id}
                    className="p-2 rounded-xl text-white bg-[#167D70] hover:bg-[#12675C] transition-colors shadow-sm disabled:opacity-50"
                    title="Accept friend request"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAction(() => onReject(req.id), req.id)}
                    disabled={processingId === req.id}
                    className="p-2 rounded-xl text-slate-500 hover:text-[#C43D4B] hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Reject friend request"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'sent' && (
        <div className="space-y-3">
          {sentRequests.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No outgoing pending requests.</p>
          ) : (
            sentRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold text-xs">
                    {(req.toDisplayName || req.toUsername || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#123B35]">{req.toDisplayName}</h4>
                    <p className="text-[11px] text-slate-500">@{req.toUsername}</p>
                    <span className="text-[10px] text-slate-400">
                      Sent {formatRelativeTime(req.createdAt)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleAction(() => onCancel(req.id), req.id)}
                  disabled={processingId === req.id}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
