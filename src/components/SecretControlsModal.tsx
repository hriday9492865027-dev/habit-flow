import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Trash2,
  LogOut,
  MapPinOff,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { profileService } from '../services/profileService';

interface SecretControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecretControlsModal: React.FC<SecretControlsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout, setSecretUnlocked } = useAuth();
  const { stopSharing } = useLocation();

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleClearLocation = async () => {
    setClearing(true);
    try {
      await stopSharing();
      setMessage('Coordinates successfully purged and sharing stopped.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message || 'Failed to clear coordinates'}`);
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await stopSharing();
      await profileService.deleteAccount(currentUser.uid);
      setSecretUnlocked(false);
      await logout();
      onClose();
    } catch (err: any) {
      setMessage(`Error: ${err.message || 'Failed to delete account'}`);
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    setSecretUnlocked(false);
    await logout();
    onClose();
  };

  const handleLockAndClose = () => {
    setSecretUnlocked(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-floating border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Unlock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#123B35]">Secret Account Controls</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Unlocked (10 Taps)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Data deletion and account options for @{currentUser.username}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message banner */}
        {message && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Actions List */}
        <div className="space-y-3.5">
          {/* Action 1: Clear Coordinates */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <MapPinOff className="w-4 h-4 text-slate-500" />
                <span>Clear Stored Coordinates</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Immediately deletes your current location document from database servers.
              </p>
            </div>
            <button
              onClick={handleClearLocation}
              disabled={clearing}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors whitespace-nowrap self-start sm:self-center shadow-xs"
            >
              {clearing ? 'Clearing...' : 'Clear Coordinates'}
            </button>
          </div>

          {/* Action 2: Delete Account */}
          <div className="p-4 rounded-2xl bg-red-50/50 border border-red-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#C43D4B]">
                <Trash2 className="w-4 h-4" />
                <span>Delete Account &amp; All Data</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Permanently removes your profile, friendships, and location documents. This cannot be undone.
              </p>
            </div>

            <div>
              {deleteConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-[#C43D4B] hover:bg-red-700 rounded-xl transition-colors whitespace-nowrap shadow-xs"
                  >
                    {deleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="px-3.5 py-2 text-xs font-bold text-[#C43D4B] bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors whitespace-nowrap self-start sm:self-center shadow-xs"
                >
                  Delete Account
                </button>
              )}
            </div>
          </div>

          {/* Action 3: Log Out */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Log Out of FriendFlow</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Sign out of your active session on this device.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 text-xs font-bold text-[#C43D4B] bg-white border border-slate-200 hover:bg-red-50 rounded-xl transition-colors whitespace-nowrap self-start sm:self-center shadow-xs"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleLockAndClose}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock &amp; Hide Controls</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-[#123B35] hover:bg-[#1a4f47] rounded-xl transition-colors"
          >
            Keep Unlocked
          </button>
        </div>
      </div>
    </div>
  );
};
