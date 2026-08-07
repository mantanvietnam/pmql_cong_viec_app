import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {authApi} from '../api/authApi';
import {getSessionAccessToken, setUnauthorizedHandler} from '../api/client';
import {getFirebaseDeviceToken} from '../services/deviceMessaging';
import {sessionStorage} from '../services/sessionStorage';
import {UserSession} from '../types/models';

type AuthState = {
  session: UserSession | null;
  isBooting: boolean;
  signIn: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateSession: (patch: Partial<UserSession>) => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isBooting, setIsBooting] = useState(true);

  const clearSession = useCallback(async () => {
    await sessionStorage.clear();
    setSession(null);
  }, []);

  useEffect(() => {
    sessionStorage.get().then(stored => {
      setSession(stored);
      setIsBooting(false);
    });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const signIn = useCallback(async (phone: string, password: string) => {
    const tokenDevice = await getFirebaseDeviceToken();
    const nextSession = await authApi.login(phone, password, tokenDevice);
    const normalizedSession = {
      ...nextSession,
      token_device: tokenDevice,
      type_device: 'mobile',
    };
    await sessionStorage.set(normalizedSession);
    setSession(normalizedSession);
  }, []);

  const signOut = useCallback(async () => {
    const token = getSessionAccessToken(session);
    if (token) await authApi.logout(token);
    await clearSession();
  }, [clearSession, session]);

  const updateSession = useCallback(
    async (patch: Partial<UserSession>) => {
      if (!session) return;
      const updated = {...session, ...patch};
      await sessionStorage.set(updated);
      setSession(updated);
    },
    [session],
  );

  const value = useMemo(
    () => ({session, isBooting, signIn, signOut, updateSession}),
    [isBooting, session, signIn, signOut, updateSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
