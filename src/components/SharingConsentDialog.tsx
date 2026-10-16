import React from 'react';
import { ShieldCheck, MapPin, Users, BatteryCharging, AlertCircle, X } from 'lucide-react';

interface SharingConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isNative: boolean;
  loading?: boolean;
}

export const SharingConsentDialog: React.FC<SharingConsentDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isNative,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-floating border border-slate-100 p-6 md:p-8 overflow-hidden relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DDF5E9] flex items-center justify-center text-[#167D70]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 id="dialog-title" className="text-xl font-bold text-[#123B35]">
              Enable Location Sharing
            </h2>
            <p className="text-xs text-slate-500 font-medium">Consent-based & privacy-first</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          FriendFlow is built on explicit consent. Before starting, please review how your coordinates
          are handled:
        </p>

        <div className="space-y-3.5 mb-6 text-sm">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <Users className="w-5 h-5 text-[#167D70] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Who sees your location:</span>
              <p className="text-xs text-slate-600 mt-0.5">
                Only mutually accepted friends. Non-friends, searchers, and pending requests can never view your coordinates.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <MapPin className="w-5 h-5 text-[#167D70] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">No Location History:</span>
              <p className="text-xs text-slate-600 mt-0.5">
                Only your single latest coordinate is kept. We do not maintain or sell a historical movement log.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <BatteryCharging className="w-5 h-5 text-[#167D70] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">
                {isNative ? 'Native Background GPS (Android)' : 'Web Browser Tracking'}
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                {isNative
                  ? 'The native Android app uses a foreground service notification to collect updates when backgrounded or locked.'
                  : 'On the web, GPS tracking runs only while this browser tab is active. Standard browsers cannot track from a closed tab.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800 text-xs mb-6">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>You can revoke or stop location sharing at any time with a single tap.</span>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#167D70] hover:bg-[#12675C] rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-[#167D70]/40 flex items-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            I Agree & Enable Sharing
          </button>
        </div>
      </div>
    </div>
  );
};
