# Toss Apps-in-Toss 템플릿

이 템플릿은 Toss의 Apps-in-Toss 플랫폼을 위한 React + TypeScript + Vite 기반 앱 개발 템플릿입니다.

## 기술 스택

- **React 18.3** - UI 라이브러리
- **TypeScript 5.6** - 타입 안정성
- **Vite 5.4** - 빠른 개발 서버 및 빌드 도구
- **React Router DOM 7** - 클라이언트 사이드 라우팅
- **Toss Design System (TDS)** - Toss 디자인 시스템
- **Tailwind CSS 3.4** - 유틸리티 우선 CSS 프레임워크
- **Apps-in-Toss Web Framework** - 앱인토스 통합 프레임워크

## 프로젝트 구조

```
template/
├── src/
│   ├── context/          # React Context (전역 상태 관리)
│   │   └── AppContext.tsx
│   ├── pages/            # 페이지 컴포넌트
│   │   ├── Home.tsx
│   │   ├── Onboarding.tsx
│   │   └── Settings.tsx
│   ├── App.tsx           # 메인 앱 컴포넌트 (라우팅)
│   ├── main.tsx          # 앱 진입점
│   ├── index.css         # 전역 스타일
│   └── vite-env.d.ts     # Vite 타입 정의
├── public/               # 정적 파일
├── index.html            # HTML 템플릿
├── package.json          # 의존성 관리
├── vite.config.ts        # Vite 설정
├── granite.config.ts     # Apps-in-Toss 설정
├── tailwind.config.cjs   # Tailwind CSS 설정
├── tsconfig.json         # TypeScript 설정
├── tsconfig.app.json     # 앱용 TypeScript 설정
├── tsconfig.node.json    # Node용 TypeScript 설정
└── eslint.config.js      # ESLint 설정
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

### 3. 빌드

```bash
npm run build
```

### 4. 배포

```bash
npm run deploy
```

## 주요 기능

### 1. Context API 패턴
- `src/context/AppContext.tsx`에서 전역 상태 관리
- LocalStorage를 활용한 데이터 영속성

### 2. 라우팅
- React Router DOM의 `MemoryRouter` 사용
- 딥링크 지원 (URL 해시 기반)
- 온보딩 플로우 지원

### 3. Toss Design System
- `@toss/tds-mobile` 컴포넌트 사용
- `ThemeProvider`로 다크모드 지원
- Toss 스타일 가이드 준수

### 4. Apps-in-Toss 통합
- `granite.config.ts`에서 앱 메타데이터 설정
- 앱인토스 웹뷰 환경 최적화
- 뒤로가기 처리 (history state)

## 커스터마이징

### 앱 정보 변경

`granite.config.ts` 파일을 수정하세요:

```typescript
export default defineConfig({
  appName: 'your-app-name',
  brand: {
    displayName: '앱 이름',
    primaryColor: '#3182F6',
    icon: 'https://your-icon-url.png',
  },
  // ...
});
```

### 새 페이지 추가

1. `src/pages/` 폴더에 새 컴포넌트 생성
2. `src/App.tsx`에 라우트 추가

```typescript
import NewPage from './pages/NewPage';

// ...
<Route path="/new-page" element={<NewPage />} />
```

### Context 확장

`src/context/AppContext.tsx`를 수정하여 필요한 상태와 함수를 추가하세요.

## 개발 가이드

### 스타일링
- Tailwind CSS 유틸리티 클래스 우선 사용
- 복잡한 스타일은 CSS 모듈 또는 Emotion 사용
- TDS 컴포넌트 최대한 활용

### 타입 안정성
- 모든 함수와 컴포넌트에 타입 정의
- `any` 타입 사용 지양
- 인터페이스 우선, 타입 별칭은 필요시에만

### 성능 최적화
- React.memo, useMemo, useCallback 적절히 활용
- 불필요한 리렌더링 방지
- 이미지 최적화

## 배포

Apps-in-Toss 플랫폼에 배포하려면:

```bash
npm run deploy
```

이 명령은 `granite build` 및 `ait deploy`를 실행하여 앱을 빌드하고 배포합니다.

## 문제 해결

### 개발 서버가 시작되지 않을 때
- `node_modules` 삭제 후 재설치
- 포트 충돌 확인 (기본: 5173)

### 빌드 오류
- TypeScript 오류 확인
- 의존성 버전 호환성 확인

## 참고 자료

- [Vite 문서](https://vitejs.dev/)
- [React 문서](https://react.dev/)
- [Toss Design System](https://toss.im/tds)
- [Apps-in-Toss 가이드](https://developers.toss.im/)
