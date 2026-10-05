import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { type StartRegistrationResponse, type User, type RegisterData } from '../types/auth.types';

const CUSTOMER_TOKEN_KEY = 'token';
const ADMIN_TOKEN_KEY = 'admin_token';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (credential: string, login?: string) => Promise<User>;
  startRegistration: (data: RegisterData) => Promise<StartRegistrationResponse>;
  completeRegistration: (data: { phone: string; otp: string; verify_token: string }) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAdminSection = location.pathname.startsWith('/admin');

  // Two independent sessions can coexist in the same browser: the customer
  // storefront (`token`) and the admin console (`admin_token`). Signing into
  // one never signs the other out.
  const [customerUser, setCustomerUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (key: string): Promise<User | null> => {
    const token = localStorage.getItem(key);
    if (!token) return null;

    try {
      const res = await authApi.getProfile(token);
      return res.data;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadProfile(CUSTOMER_TOKEN_KEY),
      loadProfile(ADMIN_TOKEN_KEY),
    ]).then(([customer, admin]) => {
      if (cancelled) return;
      setCustomerUser(customer);
      setAdminUser(admin);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  // Keep each session in sync across browser tabs. Because the tokens are
  // independent, logging out of one account never affects the other.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === CUSTOMER_TOKEN_KEY) {
        if (!event.newValue) {
          setCustomerUser(null);
          return;
        }
        loadProfile(CUSTOMER_TOKEN_KEY).then(setCustomerUser);
      } else if (event.key === ADMIN_TOKEN_KEY) {
        if (!event.newValue) {
          setAdminUser(null);
          return;
        }
        loadProfile(ADMIN_TOKEN_KEY).then(setAdminUser);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadProfile]);

  const customerLogin = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const { user, token } = res.data;
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    setCustomerUser(user);
    return user;
  }, []);

  const adminLogin = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const { user, token } = res.data;
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    setAdminUser(user);
    return user;
  }, []);

  // Google sign-in is only offered on the customer storefront, so it always
  // writes to the customer token regardless of the current route section.
  const loginWithGoogle = useCallback(async (credential: string, login?: string) => {
    const res = await authApi.googleLogin(credential, login);
    const { user, token } = res.data;
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    setCustomerUser(user);
    return user;
  }, []);

  // Phone sign-up is a two-step handshake with the Telegram bot: park the
  // details, then confirm the 6-digit code it sends to the customer's chat.
  const startRegistration = useCallback(async (data: RegisterData) => {
    const res = await authApi.startRegistration(data);
    return res.data;
  }, []);

  const completeRegistration = useCallback(async (data: { phone: string; otp: string; verify_token: string }) => {
    const res = await authApi.verifyRegistration(data);
    const { user, token } = res.data;
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    setCustomerUser(user);
    return user;
  }, []);

  const customerLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(CUSTOMER_TOKEN_KEY);
      setCustomerUser(null);
    }
  }, []);

  const adminLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      setAdminUser(null);
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    if (isAdminSection) {
      setAdminUser(updatedUser);
    } else {
      setCustomerUser(updatedUser);
    }
  }, [isAdminSection]);

  const user = isAdminSection ? adminUser : customerUser;
  const login = isAdminSection ? adminLogin : customerLogin;
  const logout = isAdminSection ? adminLogout : customerLogout;

  const value = useMemo(
    () => ({ user, loading, login, loginWithGoogle, startRegistration, completeRegistration, logout, updateUser }),
    [user, loading, login, loginWithGoogle, startRegistration, completeRegistration, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
