import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setAccessTokenUpdater, setRefreshTokenUpdater } from '../services/tokenService';

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  firstName: string;
  lastName?: string;
  profilePicture?: string;
  access?: string;
  refresh?: string;
}

interface AuthContextType {
  user: UserInfo | null;
  login: (userInfo: UserInfo) => void;
  logout: () => void;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAccess = localStorage.getItem('accessToken');
    const storedRefresh = localStorage.getItem('refreshToken');

    try {
      if (storedUser && storedAccess && storedRefresh) {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedAccess);
        setRefreshToken(storedRefresh);
      }
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }

    // Connect tokenService setters to update React state on token refresh
    setAccessTokenUpdater(setAccessToken);
    setRefreshTokenUpdater(setRefreshToken);
    setIsAuthReady(true);
  }, []);

  const login = (userInfo: UserInfo) => {
    setUser(userInfo);
    setAccessToken(userInfo.access ?? null);
    setRefreshToken(userInfo.refresh ?? null);

    localStorage.setItem('user', JSON.stringify(userInfo));
    if (userInfo.access) localStorage.setItem('accessToken', userInfo.access);
    if (userInfo.refresh) localStorage.setItem('refreshToken', userInfo.refresh);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login'; // redirect on logout
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, accessToken, refreshToken, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
