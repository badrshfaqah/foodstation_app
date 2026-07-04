import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { fetchMe, logoutRequest, requestOtp as requestOtpApi, verifyOtp as verifyOtpApi } from '@/api/auth';
import { clearToken, getToken, saveToken } from '@/api/client';
import type { User } from '@/api/types';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  requestOtp: (phone: string) => Promise<{ exists: boolean }>;
  verifyOtp: (phone: string, code: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        try {
          setUser(await fetchMe());
        } catch {
          await clearToken();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const requestOtp = useCallback((phone: string) => requestOtpApi(phone), []);

  const verifyOtp = useCallback(async (phone: string, code: string, name?: string) => {
    const { token, user: verifiedUser } = await verifyOtpApi(phone, code, name);
    await saveToken(token);
    setUser(verifiedUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // نتجاهل فشل استدعاء تسجيل الخروج على السيرفر ونمسح التوكن محلياً على أي حال.
    }
    await clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, requestOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
