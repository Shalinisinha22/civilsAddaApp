import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken as apiSetToken, removeToken as apiRemoveToken } from '@api/api';

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.auth.me();
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    if (res.success && res.data?.token && res.data.user) {
      await apiSetToken(res.data.token);
      setUser(res.data.user);
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string, name: string = '') => {
    const res = await api.auth.register(name, email, password);
    if (res.success && res.data?.token && res.data.user) {
      await apiSetToken(res.data.token);
      setUser(res.data.user);
    } else {
      throw new Error(res.message || 'Registration failed');
    }
  };

  const logout = async () => {
    await apiRemoveToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};




