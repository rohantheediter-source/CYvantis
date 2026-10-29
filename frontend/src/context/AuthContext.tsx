import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiRequest, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAnalystOrAdmin: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const userData = await apiRequest<User>('/auth/me');
          setUser(userData);
          setTokenState(storedToken);
        } catch (err) {
          removeAuthToken();
          setUser(null);
          setTokenState(null);
        }
      }
      setIsLoading(false);
    };

    fetchMe();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setAuthToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
  };

  const logout = () => {
    removeAuthToken();
    setTokenState(null);
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isAnalystOrAdmin = user?.role === 'admin' || user?.role === 'analyst';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isAnalystOrAdmin,
        isLoading,
        login,
        logout,
        updateUser
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
