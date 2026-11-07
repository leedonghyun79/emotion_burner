import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from '@toss/tds-mobile';

/**
 * 앱인토스 웹뷰 환경 초기화
 *
 * 1. history.pushState: 앱인토스 웹뷰에서 뒤로가기(back gesture) 처리 시
 *    빈 history stack으로 인해 앱이 종료되는 문제를 방지합니다.
 *
 * 2. viewport meta: granite.config.ts의 web.host가 로컬 IP이므로
 *    실제 기기에서 테스트할 때 올바른 뷰포트가 적용됩니다.
 */
window.history.pushState({ page: 'init' }, '', '');

/**
 * 앱인토스 SDK 초기화
 * - @apps-in-toss/web-framework 이 자동으로 Bridge 연결을 처리합니다.
 * - 네이티브 기능(결제, 카메라, 위치 등) 사용 시 granite.config.ts의
 *   permissions 배열에 권한을 추가하세요.
 */

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('[App] root element not found. Check your index.html');
}

createRoot(rootElement).render(
  /**
   * ThemeProvider: TDS(Toss Design System) 테마 적용
   * - 다크모드 자동 감지 (시스템 설정 따름)
   * - TDS 컴포넌트(Button, TextField, etc.) 정상 동작에 필수
   */
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);
