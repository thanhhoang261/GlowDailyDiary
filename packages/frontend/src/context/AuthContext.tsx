import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, LoginDto, RegisterDto } from '@diary/shared';
import { api, tokenStorage } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = tokenStorage.get();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      tokenStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (dto: LoginDto) => {
    const res = await api.login(dto);
    tokenStorage.set(res.token);
    setUser(res.user);
  };

  const register = async (dto: RegisterDto) => {
    const res = await api.register(dto);
    tokenStorage.set(res.token);
    setUser(res.user);
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
