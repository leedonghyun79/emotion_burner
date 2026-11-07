# 개발 가이드

이 문서는 템플릿을 사용한 앱 개발 시 알아두면 좋은 패턴과 베스트 프랙티스를 안내합니다.

## 프로젝트 구조 이해하기

```
src/
├── context/          # 전역 상태 관리
│   └── AppContext.tsx
├── pages/            # 페이지 컴포넌트
│   ├── Home.tsx
│   ├── Onboarding.tsx
│   └── Settings.tsx
├── components/       # 재사용 가능한 컴포넌트 (필요시 추가)
├── hooks/            # 커스텀 훅 (필요시 추가)
├── utils/            # 유틸리티 함수 (필요시 추가)
├── types/            # TypeScript 타입 정의 (필요시 추가)
├── App.tsx           # 라우팅 설정
├── main.tsx          # 앱 진입점
└── index.css         # 전역 스타일
```

## Context API 패턴

### 기본 사용법

```typescript
// Context에서 값 가져오기
const { isOnboardingComplete, completeOnboarding } = useApp();

// 상태 업데이트
completeOnboarding();
```

### 새로운 상태 추가하기

1. **AppState 인터페이스 확장**

```typescript
interface AppState {
  isOnboardingComplete: boolean;
  theme: 'light' | 'dark';  // 새 상태 추가
}
```

2. **초기값 설정**

```typescript
const initialState: AppState = {
  isOnboardingComplete: false,
  theme: 'light',  // 초기값 설정
};
```

3. **Context 값 인터페이스 확장**

```typescript
interface AppContextValue extends AppState {
  completeOnboarding: () => void;
  setTheme: (theme: 'light' | 'dark') => void;  // 새 함수 추가
}
```

4. **함수 구현**

```typescript
const setTheme = (theme: 'light' | 'dark') => {
  setState(prev => ({ ...prev, theme }));
};

const value: AppContextValue = {
  ...state,
  completeOnboarding,
  setTheme,  // 함수 추가
};
```

## 라우팅

### 페이지 간 이동

```typescript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  const goToSettings = () => {
    navigate('/settings');
  };
  
  return <button onClick={goToSettings}>설정</button>;
}
```

### 딥링크 지원

앱은 URL 해시를 통한 딥링크를 지원합니다:

```
https://your-app.com/#/settings  → 설정 페이지로 이동
https://your-app.com/#/          → 홈 페이지로 이동
```

### 뒤로가기 처리

앱인토스 웹뷰 환경에서 뒤로가기를 올바르게 처리하기 위해 `main.tsx`에서 초기 history state를 추가합니다:

```typescript
window.history.pushState({ page: 'init' }, '', '');
```

## 컴포넌트 작성

### 함수형 컴포넌트 기본 구조

```typescript
import { useState } from 'react';

interface MyComponentProps {
  title: string;
  onSubmit: (value: string) => void;
}

export default function MyComponent({ title, onSubmit }: MyComponentProps) {
  const [value, setValue] = useState('');
  
  const handleSubmit = () => {
    onSubmit(value);
  };
  
  return (
    <div>
      <h1>{title}</h1>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={handleSubmit}>제출</button>
    </div>
  );
}
```

### Props 타입 정의

항상 Props에 대한 인터페이스를 정의하세요:

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

// ❌ Bad
function Button(props: any) { ... }
```

## 스타일링 가이드

### Tailwind CSS 우선 사용

```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-900">제목</h2>
  <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
    버튼
  </button>
</div>
```

### 다크모드 지원

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  다크모드 지원 컨텐츠
</div>
```

### Toss Design System 활용

```tsx
import { Button, TextField, Spacing, Divider } from '@toss/tds-mobile';

<div>
  <TextField placeholder="입력하세요" />
  <Spacing size={16} />
  <Button>확인</Button>
  <Divider />
</div>
```

## 상태 관리 패턴

### Local State (useState)

컴포넌트 내부에서만 사용하는 상태:

```typescript
const [isOpen, setIsOpen] = useState(false);
const [inputValue, setInputValue] = useState('');
```

### Global State (Context)

여러 컴포넌트에서 공유하는 상태:

```typescript
const { userName, setUserName } = useApp();
```

### LocalStorage 영속성

Context의 상태는 자동으로 LocalStorage에 저장됩니다. 별도 작업 불필요.

## API 연동

### Fetch 사용 예시

```typescript
async function fetchUserData(userId: string) {
  try {
    const response = await fetch(`https://api.example.com/users/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}
```

### 로딩 상태 처리

```typescript
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchUserData(userId)
      .then(setUser)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);
  
  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;
  if (!user) return <div>사용자를 찾을 수 없습니다</div>;
  
  return <div>{user.name}</div>;
}
```

## 성능 최적화

### React.memo 사용

```typescript
import { memo } from 'react';

const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // 복잡한 렌더링 로직
  return <div>{data}</div>;
});
```

### useMemo와 useCallback

```typescript
import { useMemo, useCallback } from 'react';

function MyComponent({ items }) {
  // 비용이 큰 계산 메모이제이션
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);
  
  // 함수 메모이제이션
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);
  
  return <div>{/* ... */}</div>;
}
```

## 에러 처리

### Try-Catch 패턴

```typescript
async function saveData(data: any) {
  try {
    await api.save(data);
    alert('저장되었습니다');
  } catch (error) {
    console.error('Save failed:', error);
    alert('저장에 실패했습니다');
  }
}
```

### Error Boundary (선택사항)

복잡한 앱의 경우 Error Boundary를 추가하는 것을 권장합니다.

## 테스트 (선택사항)

### Vitest 설정

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### 간단한 테스트 예시

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders title correctly', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## 배포 전 체크리스트

- [ ] 모든 TypeScript 에러 해결
- [ ] ESLint 경고 확인 및 수정
- [ ] 빌드 성공 확인 (`npm run build`)
- [ ] 프로덕션 빌드 미리보기 (`npm run preview`)
- [ ] 다크모드 테스트
- [ ] 모바일 반응형 테스트
- [ ] 성능 확인 (Lighthouse)
- [ ] 앱 메타데이터 확인 (`granite.config.ts`)

## 유용한 VSCode 확장

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Error Translator
- Auto Rename Tag

## 추가 리소스

- [React 베스트 프랙티스](https://react.dev/learn)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 치트시트](https://nerdcave.com/tailwind-cheat-sheet)
