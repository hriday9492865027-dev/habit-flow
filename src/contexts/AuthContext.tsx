import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  register: typeof authService.register;
  login: typeof authService.login;
  logout: () => Promise<void>;
  resetPassword: typeof authService.resetPassword;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsub = authService.subscribeToAuth((profile) => {
      setCurrentUser(profile);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    await profileService.updateUserProfile(currentUser.uid, updates);
    setCurrentUser((prev) => (prev ? { ...prev, ...updates, updatedAt: Date.now() } : null));
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    const fresh = await profileService.getUserProfile(currentUser.uid);
    if (fresh) {
      setCurrentUser(fresh);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        register: authService.register,
        login: authService.login,
        logout,
        resetPassword: authService.resetPassword,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
