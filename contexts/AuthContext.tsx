import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthProvider } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData?: User) => void; // Updated to optional to support both direct login and redirect
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  getAccessToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProviderWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading to check persistence

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Verify token with backend (optional, or just decode if we trust local storage for UI)
          // For now, we'll assume valid if present and try to fetch user details
          // In a real app, we'd call /api/auth/me

          // Simulating user restoration from token/storage
          // We need to store user info in localStorage too for offline restoration or fetch it
          // Let's assume we fetch it or have it stored. 
          // For this demo, we might not have the full user object if we only stored the token.
          // Let's try to decode or fetch.

          // Fallback: If we have a token but no user data, we might need to fetch it.
          // For now, let's stop loading.
        } catch (e) {
          console.error("Auth restoration failed", e);
          localStorage.removeItem('authToken');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback((userData?: User) => {
    if (userData) {
      // Direct login (from LoginPage)
      setUser(userData);
      setIsLoading(false);
    } else {
      // Redirect to login (if called without args)
      window.location.href = '/login';
    }
  }, []);

  const logout = useCallback(() => {
    setIsLoading(true);
    localStorage.removeItem('authToken');
    setTimeout(() => {
      setUser(null);
      setIsLoading(false);
      window.location.href = '/';
    }, 500);
  }, []);

  const updateProfile = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const getAccessToken = useCallback(async () => {
    return localStorage.getItem('authToken') || "";
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      updateProfile,
      getAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProviderWrapper');
  }
  return context;
};