# 템플릿 사용 가이드 요약

## 📁 템플릿 구조

```
template/
├── 📄 설정 파일
│   ├── package.json              # 의존성 및 스크립트
│   ├── vite.config.ts            # Vite 빌드 설정
│   ├── granite.config.ts         # Apps-in-Toss 설정 ⭐
│   ├── tailwind.config.cjs       # Tailwind CSS 설정
│   ├── tsconfig.json             # TypeScript 설정
│   ├── tsconfig.app.json         # 앱용 TS 설정
│   ├── tsconfig.node.json        # Node용 TS 설정
│   ├── eslint.config.js          # ESLint 설정
│   └── .gitignore                # Git 제외 파일
│
├── 📄 문서
│   ├── README.md                 # 프로젝트 개요
│   ├── QUICKSTART.md             # 빠른 시작 가이드 ⭐
│   ├── DEVELOPMENT.md            # 개발 가이드
│   └── CHECKLIST.md              # 프로젝트 체크리스트
│
├── 📄 HTML
│   └── index.html                # HTML 템플릿
│
└── 📂 src/
    ├── main.tsx                  # 앱 진입점
    ├── App.tsx                   # 라우팅 설정
    ├── index.css                 # 전역 스타일
    ├── vite-env.d.ts             # Vite 타입 정의
    │
    ├── 📂 context/
    │   └── AppContext.tsx        # 전역 상태 관리 ⭐
    │
    └── 📂 pages/
        ├── Onboarding.tsx        # 온보딩 페이지
        ├── Home.tsx              # 홈 페이지
        └── Settings.tsx          # 설정 페이지
```

## 🚀 5분 만에 시작하기

### 1단계: 프로젝트 생성
```bash
cp -r template my-app
cd my-app
```

### 2단계: 앱 정보 수정
`granite.config.ts` 파일 열기:
```typescript
appName: 'my-app',           // 변경
displayName: '내 앱',         // 변경
primaryColor: '#3182F6',     // 변경
icon: 'https://...',         // 변경
```

### 3단계: 설치 및 실행
```bash
npm install
npm run dev
```

끝! 🎉

## 📝 주요 파일 설명

### ⭐ granite.config.ts
Apps-in-Toss 플랫폼 설정 파일. **반드시 수정해야 합니다!**

### ⭐ src/context/AppContext.tsx
전역 상태 관리. LocalStorage 자동 저장 기능 포함.

### ⭐ src/App.tsx
라우팅 설정 및 온보딩 플로우 관리.

## 🎨 주요 기능

### ✅ 온보딩 시스템
- 첫 실행 시 온보딩 페이지 표시
- 완료 후 자동으로 메인 앱 진입
- LocalStorage로 상태 저장

### ✅ 라우팅
- React Router 기반 SPA 라우팅
- 딥링크 지원 (URL 해시)
- 앱인토스 웹뷰 최적화

### ✅ 상태 관리
- Context API 기반
- LocalStorage 자동 영속성
- TypeScript 타입 안정성

### ✅ 디자인 시스템
- Toss Design System (TDS) 통합
- Tailwind CSS 유틸리티
- 다크모드 지원

## 📚 문서 가이드

### 처음 시작하는 경우
👉 **QUICKSTART.md** 읽기

### 개발 중
👉 **DEVELOPMENT.md** 참고

### 배포 전
👉 **CHECKLIST.md** 확인

## 🛠️ 주요 명령어

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 미리보기
npm run preview

# 배포
npm run deploy

# 린트
npm run lint
```

## 🎯 커스터마이징 포인트

### 1. 앱 메타데이터
📍 `granite.config.ts`

### 2. 전역 상태
📍 `src/context/AppContext.tsx`

### 3. 페이지
📍 `src/pages/`

### 4. 라우팅
📍 `src/App.tsx`

### 5. 스타일
📍 `src/index.css`, Tailwind classes

## 💡 베스트 프랙티스

### ✅ DO
- TypeScript 타입 정의 사용
- Tailwind CSS 우선 사용
- TDS 컴포넌트 활용
- Context에 전역 상태 관리
- 의미있는 컴포넌트 이름

### ❌ DON'T
- `any` 타입 사용
- 인라인 스타일 남발
- 불필요한 리렌더링
- LocalStorage 직접 조작 (Context 사용)

## 🔧 트러블슈팅

### 개발 서버가 안 열려요
```bash
rm -rf node_modules package-lock.json
npm install
```

### 빌드가 안 돼요
- TypeScript 에러 확인
- ESLint 경고 확인
- `npm run lint` 실행

### LocalStorage가 안 저장돼요
- Context Provider로 감싸져 있는지 확인
- 브라우저 개인정보 보호 모드 확인

## 📞 도움말

### 공식 문서
- [Toss Design System](https://toss.im/tds)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

### 템플릿 문서
- README.md - 프로젝트 개요
- QUICKSTART.md - 빠른 시작
- DEVELOPMENT.md - 개발 가이드
- CHECKLIST.md - 체크리스트

## 🎓 학습 경로

1. **QUICKSTART.md** 따라하기 (10분)
2. 온보딩 페이지 수정해보기 (20분)
3. 새 페이지 추가해보기 (30분)
4. **DEVELOPMENT.md** 읽기 (30분)
5. Context에 상태 추가해보기 (30분)
6. API 연동해보기 (1시간)
7. 배포하기 (30분)

**총 소요 시간: 약 3-4시간**

## 📦 포함된 패키지

### 핵심
- React 18.3
- TypeScript 5.6
- Vite 5.4

### 라우팅
- React Router DOM 7

### UI
- Toss Design System
- Tailwind CSS
- Lucide React (아이콘)

### 개발 도구
- ESLint
- TypeScript ESLint

### Apps-in-Toss
- @apps-in-toss/web-framework

## 🚀 다음 단계

1. ✅ 템플릿 복사
2. ✅ 앱 정보 수정
3. ✅ 의존성 설치
4. ✅ 개발 서버 실행
5. 🎨 디자인 커스터마이징
6. 💻 기능 개발
7. 🧪 테스트
8. 📦 배포

---

**Happy Coding! 🎉**

질문이나 문제가 있으면 각 문서를 참고하세요:
- 시작: QUICKSTART.md
- 개발: DEVELOPMENT.md
- 배포: CHECKLIST.md
