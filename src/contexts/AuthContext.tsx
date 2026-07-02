import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken as apiSetToken, removeToken as apiRemoveToken } from '@api/api';
import { configureGoogleSignIn, signInWithGoogle, signOutFromGoogle } from '@utils/googleSignIn';

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (name: string, phoneNumber: string, password: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  googleSignIn: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; phone?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    configureGoogleSignIn();
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

  const login = async (phoneNumber: string, password: string) => {
    const res = await api.auth.login(phoneNumber, password);
    if (res.success && res.data?.token && res.data.user) {
      await apiSetToken(res.data.token);
      setUser(res.data.user);
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const register = async (name: string, phoneNumber: string, password: string, email?: string) => {
    const res = await api.auth.register(name, phoneNumber, password, email);
    if (res.success && res.data?.token && res.data.user) {
      await apiSetToken(res.data.token);
      setUser(res.data.user);
    } else {
      throw new Error(res.message || 'Registration failed');
    }
  };

  const logout = async () => {
    await signOutFromGoogle();
    await apiRemoveToken();
    setUser(null);
  };

  const updateProfile = async (data: { name?: string; email?: string; phone?: string }) => {
    const res = await api.auth.updateProfile(data);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
    } else {
      throw new Error(res.message || 'Failed to update profile');
    }
  };

  const googleSignIn = async () => {
    try {
      const { idToken } = await signInWithGoogle();
      console.log('[googleSignIn] Got idToken, sending to backend...');
      const res = await api.auth.googleSignIn(idToken);
      console.log('[googleSignIn] Backend response:', JSON.stringify(res));
      if (res.success && res.data?.token && res.data.user) {
        await apiSetToken(res.data.token);
        setUser(res.data.user);
      } else {
        await signOutFromGoogle();
        throw new Error(res.message || 'Google Sign-In failed');
      }
    } catch (err) {
      console.error('[googleSignIn] Full error:', err);
      console.error('[googleSignIn] Error code:', (err as any)?.code);
      throw err;
    }
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
        googleSignIn,
        updateProfile,
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




