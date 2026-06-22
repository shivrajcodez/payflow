import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import type { User } from '@/types';

const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';

interface JwtPayload {
  sub: string;
  userId: string;
  role: string;
  exp: number;
}

export const setAuthTokens = (accessToken: string, refreshToken: string, user: User) => {
  Cookies.set(TOKEN_KEY, accessToken, { expires: 1/96, secure: true, sameSite: 'strict' });
  Cookies.set(REFRESH_KEY, refreshToken, { expires: 7, secure: true, sameSite: 'strict' });
  Cookies.set(USER_KEY, JSON.stringify(user), { expires: 7, secure: true, sameSite: 'strict' });
};

export const getAccessToken = (): string | undefined => Cookies.get(TOKEN_KEY);
export const getRefreshToken = (): string | undefined => Cookies.get(REFRESH_KEY);

export const getStoredUser = (): User | null => {
  try {
    const raw = Cookies.get(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  if (!token) return false;
  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    return Date.now() < exp * 1000;
  } catch { return false; }
};

export const clearAuth = () => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(REFRESH_KEY);
  Cookies.remove(USER_KEY);
};

export const getUserRole = (): string | null => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const { role } = jwtDecode<JwtPayload>(token);
    return role;
  } catch { return null; }
};

export const isAdmin = (): boolean => getUserRole() === 'ROLE_ADMIN';
