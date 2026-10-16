import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SharingStatus } from './SharingStatus';

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
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#123B35] flex items-center justify-center text-white shadow-subtle">
              <Radio className="w-5 h-5 text-[#2EC4B1]" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[#123B35]">FriendFlow</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold text-[#167D70] bg-[#DDF5E9] px-2 py-0.5 rounded-full uppercase tracking-wider">
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

                <button
                  onClick={() => logout()}
                  className="p-2 text-slate-400 hover:text-[#C43D4B] hover:bg-red-50 rounded-xl transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
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
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#C43D4B] bg-red-50 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
