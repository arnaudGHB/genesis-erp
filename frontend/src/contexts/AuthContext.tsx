"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '@/lib/api';

// Définir des types plus précis
interface Permission { name: string; }
interface Role { name: string; permissions: Permission[]; }
interface User {
  id: string;
  email: string;
  name: string | null;
  roles: Role[];
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setPermissions(new Set());
    // backend will clear refresh cookie on logout endpoint
    delete (api.defaults.headers.common as Record<string, string>)['Authorization'];
    window.location.href = '/login';
  }, []);

  // Optionally pass an access token to avoid relying on async default header setup
  const fetchProfile = useCallback(async (overrideToken?: string) => {
    try {
      const bearer = overrideToken ?? token ?? undefined;
      const response = await api.get('/auth/profile', bearer ? { headers: { Authorization: `Bearer ${bearer}` } } : undefined);
      setUser(response.data);
      const userPermissions = new Set<string>();
      response.data.roles.forEach((role: Role) => {
        role.permissions.forEach((perm: Permission) => {
          userPermissions.add(perm.name);
        });
      });
      setPermissions(userPermissions);
    } catch (error: unknown) {
      // Déconnecter uniquement sur 401/403 (auth invalide). Autres erreurs: ne pas boucler.
      const axiosError = error as { response?: { status?: number } };
      const status = axiosError?.response?.status;
      if (status === 401 || status === 403) {
        logout();
        return;
      }
      console.warn('fetchProfile failed (non-auth):', error);
    }
  }, [token, logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      // Try to refresh access token using HttpOnly refresh cookie
      try {
        const res = await api.post('/auth/refresh');
        const access = res.data?.access_token;
        if (access) {
          // Set token in state and ensure the axios Authorization header is set synchronously
          // before attempting to fetch the profile to avoid a race condition.
          setToken(access);
          (api.defaults.headers as Record<string, Record<string, string>>).common = (api.defaults.headers as Record<string, Record<string, string>>).common || {};
          (api.defaults.headers as Record<string, Record<string, string>>).common['Authorization'] = `Bearer ${access}`;
          await fetchProfile(access);
        }
      } catch (error: unknown) {
        // Handle network errors gracefully
        const axiosError = error as { code?: string; message?: string };
        if (axiosError.code === 'NETWORK_ERROR' || axiosError.message === 'Network Error') {
          console.warn('Network error during auth refresh, user will need to login manually');
        } else {
          console.warn('Auth refresh failed:', error);
        }
        // Clear any stale auth state
        setToken(null);
        setUser(null);
        setPermissions(new Set());
        delete (api.defaults.headers.common as Record<string, string>)['Authorization'];
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchProfile]);

  useEffect(() => {
    if (token) {
      (api.defaults.headers.common as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    } else {
      delete (api.defaults.headers.common as Record<string, string>)['Authorization'];
    }
  }, [token]);

  const login = async (newToken: string) => {
    setToken(newToken);
    (api.defaults.headers.common as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
    await fetchProfile(newToken); // Récupérer le profil juste après la connexion
  };

  const hasPermission = (permission: string) => {
    return permissions.has(permission);
  };
  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
