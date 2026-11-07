import { useState } from 'react';
import { appLogin } from '@apps-in-toss/web-framework';
import type {
  LoginRequest,
  RefreshTokenRequest,
  TokenResponse,
  AuthState,
} from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD
    ? 'https://your-production-url.app' // TODO: Change to your prod URL
    : `http://${window.location.hostname}:3005`
);

export const useAuth = (): AuthState => {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refresh_token'));
  const [userInfo, setUserInfo] = useState<AuthState['userInfo']>(JSON.parse(localStorage.getItem('user_info') || 'null'));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const saveTokens = (access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  };

  const clearAuth = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUserInfo(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
  };

  const login = async () => {
    try {
      console.log('useAuth: login flow started');
      setLoading(true);
      setError(null);

      const loginResult = await appLogin();

      if (!loginResult || !loginResult.authorizationCode) {
        throw new Error('토스 로그인 정보를 가져올 수 없습니다.');
      }

      const { authorizationCode, referrer } = loginResult;

      const response = await fetch(`${API_BASE_URL}/api/auth/get-access-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizationCode, referrer } as LoginRequest),
      });

      const result: TokenResponse = await response.json();

      if (result.data?.success) {
        saveTokens(result.data.success.accessToken, result.data.success.refreshToken);
        await getUserInfoInternal(result.data.success.accessToken);
        console.log('useAuth: login flow completed');
      } else {
        setError(result.data?.error || '로그인 실패');
      }
    } catch (e: any) {
      console.error('Login Error:', e);
      setError(e.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getUserInfoInternal = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/get-user-info`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
      });

      const result = await response.json();

      if (result.data?.success) {
        setUserInfo(result.data.success);
        localStorage.setItem('user_info', JSON.stringify(result.data.success));
      }
    } catch (e) {
      console.error('GetUserInfo Error:', e);
    }
  };

  const getUserInfo = async () => {
    if (!accessToken) return;
    setLoading(true);
    await getUserInfoInternal(accessToken);
    setLoading(false);
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken } as RefreshTokenRequest),
      });
      const result: TokenResponse = await response.json();
      if (result.data?.success) {
        saveTokens(result.data.success.accessToken, result.data.success.refreshToken);
      } else {
        clearAuth();
      }
    } catch (e) {
      console.error('Refresh Token Error:', e);
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!accessToken) {
      clearAuth();
      return;
    }
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/api/auth/logout-by-access-token`, {
        method: 'POST',
        headers: { 'Authorization': accessToken },
      });
    } catch (e) {
      console.error('Logout Error:', e);
    } finally {
      clearAuth();
      setLoading(false);
    }
  };

  return {
    accessToken,
    refreshToken,
    userInfo,
    loading,
    error,
    login,
    getUserInfo,
    refreshAccessToken,
    logout,
  };
};
