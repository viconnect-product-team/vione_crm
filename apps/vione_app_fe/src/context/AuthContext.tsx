import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface VioneUser {
  id: string;
  email?: string;
  username?: string;
  name?: string;
  avatar_url?: string;
  /** Alias cho các nơi dùng user.user_metadata.full_name */
  user_metadata?: { full_name?: string; avatar_url?: string };
}

export interface VioneSession {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  user: VioneUser;
}

type AuthStatus = 'loading' | 'in' | 'out';

type AuthContextType = {
  user: VioneUser | null;
  status: AuthStatus;
  session: VioneSession | null;
  logout: () => void;
  setAuthData: (session: any) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── JWT Helpers ───────────────────────────────────────────────────────────────

function decodeJwt(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c: any) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return false;
  // hết hạn trước 30 giây
  return decoded.exp * 1000 > Date.now() + 30_000;
}

function tokenToUser(decoded: Record<string, any>): VioneUser {
  return {
    id: decoded.sub,
    email: decoded.email || decoded.username,
    username: decoded.username,
    name: decoded.name || '',
    avatar_url: decoded.avatar_url || '',
    user_metadata: {
      full_name: decoded.name || '',
      avatar_url: decoded.avatar_url || '',
    },
  };
}

function buildSession(accessToken: string, refreshToken: string, user: VioneUser): VioneSession {
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 3600,
    token_type: 'bearer',
    user,
  };
}

function setSessionCookies(session: VioneSession) {
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${session.expires_in ?? 3600}; SameSite=Lax${secure}`;
  document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=604800; SameSite=Lax${secure}`;
}

function clearSessionCookies() {
  document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

const API_BASE =
  typeof window !== 'undefined' &&
  (window.location.protocol === 'https:' ||
    window.location.port === '5443' ||
    window.location.port === '5444' ||
    window.location.port === '5445')
    ? ''
    : ((import.meta.env.VITE_API_URL as string | undefined) ?? '');

async function apiRefresh(refreshToken: string): Promise<VioneSession | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.access_token) return null;
    const user = mapApiUser(data.user, data.access_token);
    return buildSession(data.access_token, data.refresh_token ?? refreshToken, user);
  } catch {
    return null;
  }
}

function mapApiUser(apiUser: any, accessToken: string): VioneUser {
  if (apiUser?.id) {
    return {
      id: apiUser.id,
      email: apiUser.email || apiUser.username,
      username: apiUser.username,
      name: apiUser.name || '',
      avatar_url: apiUser.avatar_url || '',
      user_metadata: {
        full_name: apiUser.name || '',
        avatar_url: apiUser.avatar_url || '',
      },
    };
  }
  // fallback: decode từ JWT
  const decoded = decodeJwt(accessToken);
  return decoded ? tokenToUser(decoded) : { id: '' };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<VioneUser | null>(null);
  const [session, setSession] = useState<VioneSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lên lịch auto-refresh token trước khi hết hạn
  function scheduleRefresh(accessToken: string, refreshToken: string) {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const decoded = decodeJwt(accessToken);
    if (!decoded?.exp) return;
    const msUntilExpiry = decoded.exp * 1000 - Date.now();
    const msUntilRefresh = Math.max(msUntilExpiry - 60_000, 10_000); // refresh 1 phút trước khi hết
    refreshTimerRef.current = setTimeout(async () => {
      const newSession = await apiRefresh(refreshToken);
      if (newSession) {
        applySession(newSession);
      } else {
        logout();
      }
    }, msUntilRefresh);
  }

  function applySession(sess: VioneSession) {
    localStorage.setItem('vibe_token', sess.access_token);
    localStorage.setItem('vibe_refresh_token', sess.refresh_token);
    setSession(sess);
    setUser(sess.user);
    setStatus('in');
    setSessionCookies(sess);
    scheduleRefresh(sess.access_token, sess.refresh_token);
  }

  useEffect(() => {
    // Khởi động: đọc token từ localStorage
    const accessToken = localStorage.getItem('vibe_token');
    const refreshToken = localStorage.getItem('vibe_refresh_token');

    if (accessToken && isTokenValid(accessToken)) {
      // Token còn hạn — dùng ngay
      const decoded = decodeJwt(accessToken)!;
      const vioneUser = tokenToUser(decoded);
      const sess = buildSession(accessToken, refreshToken ?? '', vioneUser);
      applySession(sess);
    } else if (refreshToken) {
      // Access token hết hạn nhưng còn refresh token — tự động làm mới
      apiRefresh(refreshToken).then((newSession) => {
        if (newSession) {
          applySession(newSession);
        } else {
          localStorage.removeItem('vibe_token');
          localStorage.removeItem('vibe_refresh_token');
          setStatus('out');
        }
      });
    } else {
      setStatus('out');
    }

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    localStorage.removeItem('vibe_token');
    localStorage.removeItem('vibe_refresh_token');
    clearSessionCookies();
    setUser(null);
    setSession(null);
    setStatus('out');
  };

  /** Gọi sau khi login thành công — nhận response từ NestJS /auth/login */
  const setAuthData = (data: any) => {
    if (!data?.access_token) return;
    const vioneUser = mapApiUser(data.user, data.access_token);
    const sess = buildSession(
      data.access_token,
      data.refresh_token ?? localStorage.getItem('vibe_refresh_token') ?? '',
      vioneUser,
    );
    applySession(sess);
  };

  return (
    <AuthContext.Provider value={{ user, status, session, logout, setAuthData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
