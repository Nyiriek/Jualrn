// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserInfo {
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // On mount, load from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAccess = localStorage.getItem("accessToken");
    const storedRefresh = localStorage.getItem("refreshToken");
    if (storedUser && storedAccess && storedRefresh) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedAccess);
      setRefreshToken(storedRefresh);
    }
  }, []);

  // Login: store in state + localStorage
  const login = (userInfo: any) => {
    setUser(userInfo);
    setAccessToken(userInfo.access);
    setRefreshToken(userInfo.refresh);

    localStorage.setItem("user", JSON.stringify(userInfo));
    localStorage.setItem("accessToken", userInfo.access);
    localStorage.setItem("refreshToken", userInfo.refresh);
  };

  // Logout: clear everything
  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, accessToken, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const useIsAuthenticated = () => {
  const { user } = useAuth();
  return !!user;
};
