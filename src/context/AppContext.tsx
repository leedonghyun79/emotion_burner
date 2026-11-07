import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

/* ============================================================
   타입 정의
   ============================================================ */

/** 앱 전역 상태 */
interface AppState {
  /** 온보딩 완료 여부 */
  isOnboardingComplete: boolean;
  /** 사용자 닉네임 (온보딩에서 입력) */
  userName: string;
  /** 알림 수신 동의 여부 */
  notificationEnabled: boolean;
}

/** Context에서 노출되는 값과 액션 */
interface AppContextValue extends AppState {
  /** 온보딩 완료 처리 */
  completeOnboarding: (name: string) => void;
  /** 사용자 이름 업데이트 */
  updateUserName: (name: string) => void;
  /** 알림 설정 토글 */
  toggleNotification: () => void;
  /** 앱 초기화 (개발/QA용) */
  resetApp: () => void;
}

/* ============================================================
   Context 생성
   ============================================================ */

const AppContext = createContext<AppContextValue | undefined>(undefined);

/** LocalStorage 키 상수 */
const STORAGE_KEY = 'ait-app-state-v1';

/** 기본 초기 상태 */
const initialState: AppState = {
  isOnboardingComplete: false,
  userName: '',
  notificationEnabled: true,
};

/* ============================================================
   LocalStorage 유틸리티
   ============================================================ */

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      // 저장된 값과 initialState를 병합 → 새 필드 추가 시 안전
      return { ...initialState, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('[AppContext] localStorage 로드 실패:', err);
  }
  return initialState;
}

function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[AppContext] localStorage 저장 실패:', err);
  }
}

/* ============================================================
   AppProvider
   ============================================================ */

interface AppProviderProps {
  children: ReactNode;
}

/**
 * AppProvider
 *
 * - 앱 전역 상태를 관리하는 Context Provider
 * - 상태 변경 시 자동으로 LocalStorage에 저장 (영속성)
 * - 모든 액션 함수는 useCallback으로 메모이제이션
 *
 * @example
 * <AppProvider>
 *   <App />
 * </AppProvider>
 */
export function AppProvider({ children }: AppProviderProps) {
  const [state, setState] = useState<AppState>(loadState);

  // 상태 변경 시 LocalStorage 자동 동기화
  useEffect(() => {
    saveState(state);
  }, [state]);

  /**
   * 온보딩 완료
   * @param name - 사용자가 입력한 닉네임
   */
  const completeOnboarding = useCallback((name: string) => {
    setState(prev => ({
      ...prev,
      isOnboardingComplete: true,
      userName: name.trim(),
    }));
  }, []);

  /**
   * 사용자 이름 업데이트
   */
  const updateUserName = useCallback((name: string) => {
    setState(prev => ({ ...prev, userName: name.trim() }));
  }, []);

  /**
   * 알림 설정 토글
   */
  const toggleNotification = useCallback(() => {
    setState(prev => ({ ...prev, notificationEnabled: !prev.notificationEnabled }));
  }, []);

  /**
   * 앱 전체 초기화 (개발·QA 환경 전용)
   * ⚠️ 프로덕션에서는 사용자에게 노출하지 마세요.
   */
  const resetApp = useCallback(() => {
    setState(initialState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: AppContextValue = {
    ...state,
    completeOnboarding,
    updateUserName,
    toggleNotification,
    resetApp,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/* ============================================================
   useApp Hook
   ============================================================ */

/**
 * 앱 전역 상태 및 액션에 접근하는 커스텀 훅
 *
 * @example
 * const { userName, completeOnboarding } = useApp();
 *
 * @throws AppProvider 외부에서 사용 시 에러
 */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (ctx === undefined) {
    throw new Error('[useApp] AppProvider 내부에서만 사용할 수 있습니다.');
  }
  return ctx;
}
