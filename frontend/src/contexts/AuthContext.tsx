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
    localStorage.removeItem('access_token');
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
      console.error("Failed to fetch profile, logging out.", error);
      logout(); // Si le token est invalide, on déconnecte
    }
  }, [logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        try {
          await fetchProfile();
        } catch (error) {
          console.error("Profile fetch failed:", error);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchProfile]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('access_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const login = async (newToken: string) => {
    setToken(newToken);
    await fetchProfile(); // Récupérer le profil juste après la connexion
  };

  const hasPermission = (permission: string) => {
    return permissions.has(permission);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading, hasPermission }}>
      {!isLoading && children}
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
