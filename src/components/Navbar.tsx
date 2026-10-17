import React, { useState, useRef } from 'react';
import {
  MapPin,
  Users,
  ArrowRightLeft,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  Radio,
  Unlock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SharingStatus } from './SharingStatus';
import { SecretControlsModal } from './SecretControlsModal';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingRequestsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  pendingRequestsCount,
}) => {
  const { currentUser, logout, isSecretUnlocked, toggleSecretUnlocked } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [secretModalOpen, setSecretModalOpen] = useState(false);

  // 10-click secret detection on FriendFlow logo
  const [clicks, setClicks] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const resetTimerRef = useRef<any>(null);

  const handleLogoClick = () => {
    onSelectTab('dashboard');

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    const nextClicks = clicks + 1;
    setClicks(nextClicks);

    if (nextClicks >= 10) {
      setClicks(0);
      const unlockedNow = toggleSecretUnlocked();
      if (unlockedNow) {
        setToastMessage('🔓 Secret Controls Unlocked! Log Out and Data Deletion options are now available.');
        setSecretModalOpen(true);
      } else {
        setToastMessage('🔒 Secret Controls Locked. Log Out and Data Deletion options are now hidden.');
      }
      setTimeout(() => setToastMessage(null), 4500);
      return;
    }

    if (nextClicks >= 5) {
      const remaining = 10 - nextClicks;
      setToastMessage(`You are ${remaining} tap${remaining === 1 ? '' : 's'} away from unlocking secret controls.`);
    }

    resetTimerRef.current = setTimeout(() => {
      setClicks(0);
      setToastMessage(null);
    }, 3500);
  };

  const navItems = [
    { id: 'dashboard', label: 'Map', icon: MapPin },
    {
      id: 'friends',
      label: 'Friends',
      icon: Users,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
    },
    { id: 'distance', label: 'Distance', icon: ArrowRightLeft },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo with 10-tap secret trigger */}
            <div
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 cursor-pointer select-none active:scale-95 transition-transform"
              title="Click 10 times to unlock secret controls"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#123B35] flex items-center justify-center text-white shadow-subtle relative">
                <Radio className="w-5 h-5 text-[#2EC4B1]" />
                {clicks > 0 && clicks < 10 && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center animate-ping">
                    {clicks}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-[#123B35]">FriendFlow</span>
                  {isSecretUnlocked && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded uppercase">
                      Admin
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline-block text-[10px] font-bold text-[#167D70] bg-[#DDF5E9] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Consent GPS
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#123B35] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="w-4 h-4 rounded-full bg-[#167D70] text-white text-[10px] flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right section: Quick Sharing Pill + Profile */}
            <div className="flex items-center gap-3">
              <SharingStatus compact />

              {currentUser && (
                <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-200">
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#123B35] leading-tight">
                      {currentUser.displayName}
                    </div>
                    <div className="text-[10px] text-slate-400">@{currentUser.username}</div>
                  </div>

                  {/* Secret Unlocked Controls: Logout icon & quick modal trigger */}
                  {isSecretUnlocked && (
                    <div className="flex items-center gap-1 animate-fade-in">
                      <button
                        onClick={() => setSecretModalOpen(true)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                        title="Secret Account & Deletion Controls"
                      >
                        <Unlock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => logout()}
                        className="p-2 text-slate-400 hover:text-[#C43D4B] hover:bg-red-50 rounded-xl transition-colors"
                        title="Sign out (Unlocked)"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile menu hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl md:hidden"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Floating Tap Feedback Toast */}
        {toastMessage && (
          <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-[#123B35] text-white px-4 py-2.5 rounded-2xl shadow-floating text-xs font-semibold flex items-center gap-2 border border-[#2EC4B1]/40 animate-fade-in max-w-md text-center">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Mobile drop menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#123B35] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="w-5 h-5 rounded-full bg-[#167D70] text-white text-xs flex items-center justify-center font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {currentUser && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between px-3">
                <div>
                  <p className="text-xs font-bold text-[#123B35]">{currentUser.displayName}</p>
                  <p className="text-[11px] text-slate-500">@{currentUser.username}</p>
                </div>

                {isSecretUnlocked && (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <button
                      onClick={() => {
                        setSecretModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="px-2.5 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 rounded-lg"
                    >
                      Controls
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#C43D4B] bg-red-50 rounded-lg"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Secret Controls Modal Dialog */}
      <SecretControlsModal
        isOpen={secretModalOpen}
        onClose={() => setSecretModalOpen(false)}
      />
    </>
  );
};
