import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { FriendsPage } from './pages/FriendsPage';
import { DistancePage } from './pages/DistancePage';
import { SettingsPage } from './pages/SettingsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { useFriendRequests } from './hooks/useFriendRequests';
import { Radio } from 'lucide-react';

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [focusedFriendUid, setFocusedFriendUid] = useState<string | null>(null);

  // Hook for pending count in navbar badge
  const { receivedRequests } = useFriendRequests();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F5] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#123B35] flex items-center justify-center text-white mb-4 animate-pulse shadow-card">
          <Radio className="w-7 h-7 text-[#2EC4B1]" />
        </div>
        <h2 className="text-base font-bold text-[#123B35]">FriendFlow</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting location services...</p>
      </div>
    );
  }

  // Unauthenticated user views
  if (!currentUser) {
    if (authView === 'login') {
      return (
        <LoginPage
          onGoRegister={() => setAuthView('register')}
          onGoLanding={() => setAuthView('landing')}
        />
      );
    }
    if (authView === 'register') {
      return (
        <RegisterPage
          onGoLogin={() => setAuthView('login')}
          onGoLanding={() => setAuthView('landing')}
        />
      );
    }
    return (
      <LandingPage
        onGoLogin={() => setAuthView('login')}
        onGoRegister={() => setAuthView('register')}
      />
    );
  }

  // Authenticated application views
  return (
    <div className="min-h-screen bg-[#F7F8F5] flex flex-col pb-16 md:pb-0">
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'distance') {
            setFocusedFriendUid(null);
          }
        }}
        pendingRequestsCount={receivedRequests.length}
      />

      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <DashboardPage
            onGoFriends={() => setCurrentTab('friends')}
            onGoDistance={(friendUid) => {
              setFocusedFriendUid(friendUid || null);
              setCurrentTab('distance');
            }}
          />
        )}

        {currentTab === 'friends' && (
          <FriendsPage
            onGoDashboard={() => setCurrentTab('dashboard')}
            onGoDistance={(friendUid) => {
              setFocusedFriendUid(friendUid || null);
              setCurrentTab('distance');
            }}
          />
        )}

        {currentTab === 'distance' && (
          <DistancePage initialFriendUid={focusedFriendUid} />
        )}

        {currentTab === 'settings' && <SettingsPage />}

        {currentTab === 'privacy' && <PrivacyPage />}
      </main>

      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'distance') {
            setFocusedFriendUid(null);
          }
        }}
        pendingRequestsCount={receivedRequests.length}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="FriendFlow Application Error">
      <AuthProvider>
        <LocationProvider>
          <AppContent />
        </LocationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
