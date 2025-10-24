"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  login: (token: string) => Promise<void>; // Changé en Promise
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean; // Nouvelle fonction
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data);
      // Consolider toutes les permissions de tous les rôles dans un Set pour une recherche rapide
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
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}` ;
      fetchProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('access_token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}` ;
    await fetchProfile(); // Récupérer le profil juste après la connexion
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setPermissions(new Set());
    localStorage.removeItem('access_token');
    delete api.defaults.headers.common['Authorization'];
    window.location.href = '/login';
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
