import React from 'react';
import {
  ShieldCheck,
  Radio,
  MapPin,
  Compass,
  ArrowRight,
  BatteryCharging,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

interface LandingPageProps {
  onGoLogin: () => void;
  onGoRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoLogin,
  onGoRegister,
}) => {
  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#2B3441] flex flex-col">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#123B35] flex items-center justify-center text-white shadow-subtle">
            <Radio className="w-5 h-5 text-[#2EC4B1]" />
          </div>
          <span className="text-xl font-black tracking-tight text-[#123B35]">FriendFlow</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGoLogin}
            className="px-4 py-2 text-xs font-bold text-[#123B35] hover:bg-slate-100 rounded-xl transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onGoRegister}
            className="px-4 py-2 text-xs font-bold text-white bg-[#167D70] hover:bg-[#12675C] rounded-xl shadow-sm transition-all"
          >
            Create Account
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#DDF5E9] text-[#123B35] text-xs font-bold mb-6">
            <ShieldCheck className="w-4 h-4 text-[#167D70]" />
            <span>Consent-Based &bull; Zero Surveillance &bull; Private</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-[#123B35] tracking-tight leading-[1.15] mb-5">
            Know where your friends are, <span className="text-[#167D70]">only when they want to be found.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
            FriendFlow is a consent-first location platform. Share your live coordinates strictly with
            mutually accepted friends. Track straight-line and driving distances with no location history,
            no public leaks, and instant stop controls.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10">
            <button
              onClick={onGoRegister}
              className="px-6 py-3.5 text-sm font-bold text-white bg-[#167D70] hover:bg-[#12675C] rounded-2xl shadow-card flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onGoLogin}
              className="px-6 py-3.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all text-center"
            >
              Sign In to Existing Account
            </button>
          </div>

          {/* Highlights checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#167D70] shrink-0" />
              <span>Location sharing is OFF by default</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#167D70] shrink-0" />
              <span>Haversine &amp; OSRM Road Distance</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#167D70] shrink-0" />
              <span>Native Android Background GPS</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#167D70] shrink-0" />
              <span>Strict Firestore Security Rules</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div className="relative">
          <div className="w-full bg-white rounded-3xl border border-slate-200/80 p-6 shadow-floating space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#DDF5E9] flex items-center justify-center text-[#167D70]">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#123B35]">Live Map Preview</h3>
                  <p className="text-xs text-slate-500">Authorized peer coordinates only</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Sharing Active
              </span>
            </div>

            {/* Simulated Friend item */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#F7F8F5] border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#123B35] text-white flex items-center justify-center font-bold text-xs">
                    SM
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#123B35]">Sarah Miller</h4>
                    <p className="text-[11px] text-slate-500">@sarah &bull; Just now</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#167D70]">1.4 km</span>
                  <span className="text-[10px] text-slate-400 block">Straight-line</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold text-xs">
                    AK
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#123B35]">Alex Kim</h4>
                    <p className="text-[11px] text-slate-500">@alex &bull; 8m ago</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700">4.8 km</span>
                  <span className="text-[10px] text-slate-400 block">Road: ~12 mins</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#DDF5E9]/50 border border-[#167D70]/20 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-[#123B35]">Privacy by Design Guarantee:</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Friend search displays public display names only. Coordinates are never queried, returned,
                or stored without reciprocal friendship confirmation.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} FriendFlow &bull; OpenStreetMap Data &bull; Built with Privacy First</p>
      </footer>
    </div>
  );
};
