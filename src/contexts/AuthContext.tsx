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
  isSecretUnlocked: boolean;
  setSecretUnlocked: (unlocked: boolean) => void;
  toggleSecretUnlocked: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SECRET_STORAGE_KEY = 'friendflow_secret_controls_unlocked';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return authService.getCurrentStoredUser();
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return !authService.getCurrentStoredUser();
  });
  const [isSecretUnlocked, setIsSecretUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SECRET_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const setSecretUnlocked = (val: boolean) => {
    setIsSecretUnlocked(val);
    try {
      localStorage.setItem(SECRET_STORAGE_KEY, String(val));
    } catch {
      // ignore storage error
    }
  };

  const toggleSecretUnlocked = (): boolean => {
    const next = !isSecretUnlocked;
    setSecretUnlocked(next);
    return next;
  };

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
    setSecretUnlocked(false);
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
        isSecretUnlocked,
        setSecretUnlocked,
        toggleSecretUnlocked,
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
