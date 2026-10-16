import React from 'react';
import { ShieldCheck, EyeOff, Radio, BatteryCharging, AlertTriangle, FileText } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDF5E9] text-[#123B35] text-xs font-bold mb-2">
          <ShieldCheck className="w-4 h-4 text-[#167D70]" />
          <span>Privacy &amp; Consent Charter</span>
        </div>
        <h1 className="text-2xl font-black text-[#123B35] tracking-tight">Our Privacy Commitment</h1>
        <p className="text-xs text-slate-500 mt-1">
          FriendFlow was designed from the ground up as a transparent, consent-first utility.
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
        {/* Core Principles */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-4">
          <h2 className="text-base font-bold text-[#123B35]">1. Explicit, Revocable Consent</h2>
          <p>
            Location sharing is <strong>turned off by default</strong> for all accounts. Your coordinates
            are only captured and transmitted after you explicitly tap &quot;Start Sharing&quot; and accept
            the consent dialog. You can revoke access at any second with a single tap.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-4">
          <h2 className="text-base font-bold text-[#123B35]">2. Mutual Friendships Only</h2>
          <p>
            Coordinates are never exposed to public search engines, strangers, or pending requests. Only
            mutually accepted friends are granted database access to read your current location. If you
            remove a friend or reject a request, their read access is terminated immediately by Firestore
            Security Rules.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-4">
          <h2 className="text-base font-bold text-[#123B35]">3. No Movement Trails or Location History</h2>
          <p>
            FriendFlow stores only your single latest coordinate (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">users/{'{uid}'}/location/current</code>).
            When you stop sharing, this record is deleted. We do not maintain or commercialize a history of
            your past locations or routes.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-4">
          <h2 className="text-base font-bold text-[#123B35]">4. Device &amp; Android Background GPS Realities</h2>
          <p>
            Operating systems enforce strict boundaries for user privacy. In FriendFlow:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
            <li>
              <strong>Android Native App:</strong> Uses a Foreground Service with a persistent notification
              to legally and transparently collect updates when the phone is locked or backgrounded.
            </li>
            <li>
              <strong>Force Stop &amp; Power Off:</strong> If an Android app is force-stopped by the user
              or the phone is shut down, background tracking ceases immediately. We never claim impossible
              tracking guarantees.
            </li>
            <li>
              <strong>Web Browser Tab:</strong> Standard web browsers cannot run background GPS after
              the tab is closed or discarded by the operating system.
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-4">
          <h2 className="text-base font-bold text-[#123B35]">5. Map Tiles &amp; Routing Fair Use</h2>
          <p className="text-xs text-slate-600">
            Map tiles are provided by OpenStreetMap contributors. Driving route calculations use the Open
            Source Routing Machine (OSRM). In compliance with provider usage policies, FriendFlow limits
            routing requests and gracefully falls back to straight-line Haversine distance when limits or
            network boundaries are reached.
          </p>
        </div>
      </div>
    </div>
  );
};
