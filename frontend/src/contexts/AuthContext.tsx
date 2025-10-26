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
    delete api.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data);
      const userPermissions = new Set<string>();
      response.data.roles.forEach((role: Role) => {
        role.permissions.forEach((perm: Permission) => {
          userPermissions.add(perm.name);
        });
      });
      setPermissions(userPermissions);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      // Ne déconnecter que si on a déjà un token (token expiré/invalide)
      // Pas pendant la première connexion
      if (token) {
        logout();
      }
    }
  }, [token, logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      // Try to refresh access token using HttpOnly refresh cookie
      try {
        const res = await api.post('/auth/refresh');
        const access = res.data?.access_token;
        if (access) {
          setToken(access);
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
          await fetchProfile();
        }
      } catch (e) {
        // no valid session
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchProfile]);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const login = async (newToken: string) => {
    setToken(newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    await fetchProfile(); // Récupérer le profil juste après la connexion
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
