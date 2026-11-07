import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthState } from '../types/auth';

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  // 토큰이 있지만 사용자 정보가 없는 경우 로드
  useEffect(() => {
    if (auth.accessToken && !auth.userInfo) {
      auth.getUserInfo();
    }
  }, [auth.accessToken, auth.userInfo]);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
