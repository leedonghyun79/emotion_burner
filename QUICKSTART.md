# 빠른 시작 가이드

이 가이드는 템플릿을 사용하여 새로운 Toss 앱을 빠르게 시작하는 방법을 안내합니다.

## 1. 프로젝트 생성

### 템플릿 복사
```bash
# 템플릿 폴더를 새 프로젝트로 복사
cp -r template my-new-app
cd my-new-app
```

## 2. 프로젝트 설정

### 2.1 앱 정보 수정

`granite.config.ts` 파일을 열고 앱 정보를 수정하세요:

```typescript
export default defineConfig({
  appName: 'my-awesome-app',  // 앱 고유 ID (영문, 하이픈 가능)
  brand: {
    displayName: '내 멋진 앱',  // 사용자에게 표시될 앱 이름
    primaryColor: '#3182F6',    // 앱의 주요 색상
    icon: 'https://...',        // 앱 아이콘 URL
  },
  web: {
    host: '192.168.0.201',      // 개발 서버 IP (로컬 네트워크 IP로 변경)
    port: 5173,
  },
  // ...
});
```

### 2.2 package.json 수정

`package.json` 파일을 열고 프로젝트 이름을 수정하세요:

```json
{
  "name": "my-awesome-app",
  // ...
}
```

### 2.3 HTML 제목 수정

`index.html` 파일에서 타이틀을 수정하세요:

```html
<title>내 멋진 앱</title>
```

## 3. 의존성 설치

```bash
npm install
```

## 4. 개발 서버 실행

```bash
npm run dev
```

개발 서버가 실행되면 터미널에 표시된 URL로 접속하세요.

## 5. 앱 커스터마이징

### 5.1 온보딩 화면 수정

`src/pages/Onboarding.tsx` 파일을 수정하여 온보딩 화면을 커스터마이징하세요.

### 5.2 홈 화면 수정

`src/pages/Home.tsx` 파일을 수정하여 메인 화면을 구성하세요.

### 5.3 새 페이지 추가

1. `src/pages/` 폴더에 새 파일 생성 (예: `MyPage.tsx`)
2. `src/App.tsx`에 라우트 추가:

```typescript
import MyPage from './pages/MyPage';

// AppRoutes 함수 내부에 추가
<Route path="/my-page" element={<MyPage />} />
```

### 5.4 전역 상태 추가

`src/context/AppContext.tsx` 파일을 수정하여 필요한 상태를 추가하세요:

```typescript
interface AppState {
  isOnboardingComplete: boolean;
  userName: string;  // 새로운 상태 추가
  // ...
}

interface AppContextValue extends AppState {
  completeOnboarding: () => void;
  setUserName: (name: string) => void;  // 새로운 함수 추가
  // ...
}
```

## 6. 스타일링

### Tailwind CSS 사용

```tsx
<div className="bg-blue-500 text-white p-4 rounded-lg">
  Hello World
</div>
```

### Toss Design System 컴포넌트 사용

```tsx
import { Button, TextField, Spacing } from '@toss/tds-mobile';

<Button onClick={handleClick}>클릭</Button>
<TextField value={text} onChange={handleChange} />
<Spacing size={16} />
```

## 7. 빌드 및 배포

### 로컬 빌드 테스트

```bash
npm run build
npm run preview
```

### Apps-in-Toss 배포

```bash
npm run deploy
```

## 8. 디버깅 팁

### 개발자 도구 사용
- Chrome DevTools를 열어 콘솔, 네트워크, 요소 검사 등을 활용하세요

### LocalStorage 확인
- DevTools > Application > Local Storage에서 저장된 데이터 확인

### 앱 초기화
- 설정 페이지에서 "앱 초기화" 버튼 클릭
- 또는 콘솔에서 `localStorage.clear()` 실행

## 9. 다음 단계

- [ ] 앱의 핵심 기능 구현
- [ ] UI/UX 디자인 개선
- [ ] API 연동 (필요한 경우)
- [ ] 에러 처리 및 로딩 상태 추가
- [ ] 성능 최적화
- [ ] 테스트 작성
- [ ] 배포 및 모니터링

## 도움이 필요하신가요?

- [Toss Design System 문서](https://toss.im/tds)
- [React 공식 문서](https://react.dev/)
- [Vite 공식 문서](https://vitejs.dev/)
- [Tailwind CSS 문서](https://tailwindcss.com/)
