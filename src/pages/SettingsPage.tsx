import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { profileService } from '../services/profileService';
import { SharingStatus } from '../components/SharingStatus';
import {
  User,
  Shield,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Smartphone,
  Globe,
  Radio,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentUser, updateProfile, logout } = useAuth();
  const { isSharing, isNativePlatform, myLocation, stopSharing } = useLocation();

  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');

  const handleCopyFriendCode = () => {
    if (currentUser?.friendCode) {
      navigator.clipboard.writeText(currentUser.friendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    await updateProfile({ displayName: displayName.trim() });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleClearLocation = async () => {
    await stopSharing();
    alert('Current location document cleared and sharing disabled.');
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setDeleting(true);
    try {
      await stopSharing();
      await profileService.deleteAccount(currentUser.uid);
      await logout();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-[#123B35] tracking-tight">Account &amp; Privacy Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Control your profile, sharing permissions, and personal data retention.
        </p>
      </div>

      {/* Profile & Friend Code */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#DDF5E9] flex items-center justify-center text-[#167D70]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#123B35]">Your Profile</h2>
            <p className="text-xs text-slate-500">How friends recognize you across FriendFlow</p>
          </div>
        </div>

        {/* Unique Friend Code */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Your Unique Friend Code</span>
            <span className="text-lg font-black text-[#123B35] tracking-widest font-mono">
              {currentUser?.friendCode || `FF-${currentUser?.uid.substring(0, 4).toUpperCase()}`}
            </span>
          </div>

          <button
            onClick={handleCopyFriendCode}
            className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2 shadow-xs transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#167D70]/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username (Fixed)</label>
              <input
                type="text"
                disabled
                value={`@${currentUser?.username}`}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {saveSuccess && (
            <p className="text-xs text-emerald-600 font-semibold">Profile updated successfully.</p>
          )}

          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-white bg-[#167D70] hover:bg-[#12675C] rounded-xl shadow-xs transition-colors"
          >
            Save Changes
          </button>
        </form>
      </section>

      {/* Location Sharing Controller */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#DDF5E9] flex items-center justify-center text-[#167D70]">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#123B35]">Location Sharing Control</h2>
            <p className="text-xs text-slate-500">Toggle live broadcast and manage background behavior</p>
          </div>
        </div>

        <SharingStatus />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Smartphone className="w-4 h-4 text-[#167D70]" />
              <span>Android Background GPS</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              When using the installed native Android application, GPS tracking continues while
              backgrounded or locked using an Android Foreground Service notification.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Globe className="w-4 h-4 text-[#167D70]" />
              <span>Web Browser Platform</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Standard browser security isolates closed tabs. Live tracking on the web requires the
              FriendFlow tab to remain open and active.
            </p>
          </div>
        </div>
      </section>

      {/* Data Retention & Privacy Controls */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-[#C43D4B]">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#123B35]">Data Deletion &amp; Account Controls</h2>
            <p className="text-xs text-slate-500">Permanently purge your location or delete your account</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Clear Stored Coordinates</h4>
              <p className="text-[11px] text-slate-500">
                Immediately deletes your current location record from database servers.
              </p>
            </div>
            <button
              onClick={handleClearLocation}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors self-start sm:self-center"
            >
              Clear Coordinates
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-red-50/50 border border-red-200/60 gap-3">
            <div>
              <h4 className="text-xs font-bold text-[#C43D4B]">Delete Account &amp; All Data</h4>
              <p className="text-[11px] text-slate-500">
                Permanently removes your profile, friendships, and location documents. This cannot be undone.
              </p>
            </div>

            <div>
              {deleteConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-[#C43D4B] hover:bg-red-700 rounded-xl transition-colors"
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
                  className="px-3.5 py-2 text-xs font-bold text-[#C43D4B] bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors self-start sm:self-center"
                >
                  Delete Account
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
