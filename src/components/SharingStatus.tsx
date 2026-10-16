import React, { useState } from 'react';
import { Radio, Power, AlertTriangle, Shield, CheckCircle2, RefreshCw } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import { SharingConsentDialog } from './SharingConsentDialog';
import { formatRelativeTime } from '../lib/distance';

interface SharingStatusProps {
  compact?: boolean;
}

export const SharingStatus: React.FC<SharingStatusProps> = ({ compact = false }) => {
  const {
    myLocation,
    isSharing,
    isTrackingActive,
    startSharing,
    stopSharing,
    trackingError,
    permissionState,
    isNativePlatform,
  } = useLocation();

  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleClick = () => {
    if (isSharing) {
      stopSharing();
    } else {
      setIsConsentOpen(true);
    }
  };

  const handleConfirmConsent = async () => {
    setLoading(true);
    try {
      await startSharing();
      setIsConsentOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <>
        <button
          onClick={handleToggleClick}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            isSharing
              ? 'bg-[#DDF5E9] text-[#123B35] border-[#167D70]/30 hover:bg-[#c9eedb]'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
          title={isSharing ? 'Sharing is active. Click to stop.' : 'Location sharing is off. Click to start.'}
        >
          {isSharing ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
              </span>
              <span>Sharing Active</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Sharing Off</span>
            </>
          )}
        </button>

        <SharingConsentDialog
          isOpen={isConsentOpen}
          onClose={() => setIsConsentOpen(false)}
          onConfirm={handleConfirmConsent}
          isNative={isNativePlatform}
          loading={loading}
        />
      </>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                isSharing
                  ? 'bg-[#DDF5E9] text-[#167D70]'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Radio className={`w-5 h-5 ${isSharing ? 'animate-pulse text-[#167D70]' : ''}`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#123B35]">Location Sharing</h4>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isSharing
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isSharing ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active
                    </>
                  ) : (
                    'Disabled'
                  )}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-0.5">
                {isSharing
                  ? isNativePlatform
                    ? 'Background GPS active with foreground notification'
                    : 'Broadcasting live coordinates to accepted friends'
                  : 'Your coordinates are private and hidden from everyone'}
              </p>

              {isSharing && myLocation && (
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                  <span>Accuracy: ~{Math.round(myLocation.accuracyMeters)}m</span>
                  <span>•</span>
                  <span>Updated: {formatRelativeTime(myLocation.capturedAt)}</span>
                  <span>•</span>
                  <span className="capitalize">{myLocation.platform} GPS</span>
                </div>
              )}

              {trackingError && (
                <div className="flex items-center gap-1.5 text-xs text-[#C43D4B] mt-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{trackingError}</span>
                </div>
              )}

              {permissionState.isDenied && (
                <div className="text-xs text-amber-700 mt-1">
                  Location permission was denied in your browser settings.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleToggleClick}
              disabled={loading}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isSharing
                  ? 'bg-red-50 text-[#C43D4B] hover:bg-red-100 border border-red-200 focus:ring-2 focus:ring-red-400/40'
                  : 'bg-[#167D70] text-white hover:bg-[#12675C] focus:ring-2 focus:ring-[#167D70]/40'
              }`}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Power className="w-4 h-4" />
              )}
              {isSharing ? 'Stop Sharing' : 'Start Sharing'}
            </button>
          </div>
        </div>
      </div>

      <SharingConsentDialog
        isOpen={isConsentOpen}
        onClose={() => setIsConsentOpen(false)}
        onConfirm={handleConfirmConsent}
        isNative={isNativePlatform}
        loading={loading}
      />
    </>
  );
};
