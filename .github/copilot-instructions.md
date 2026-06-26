# 한맥가족 경영자정보시스템 — AI 코딩 룰

## 프로젝트 개요

- **스택**: React 18 + TypeScript + Vite 8 (OXC/rolldown 파서)
- **스타일**: CSS (src/styles/App.css, src/styles/index.css) — Tailwind 없음, CSS Variable 기반
- **DB**: Firebase (현재 미연결 — UI 작업 중), mock 훅 사용 중
- **포트**: 5175 고정 (strictPort: true)
- **인코딩**: 모든 파일 UTF-8 with BOM — PowerShell 파일 작업 시 반드시 `New-Object System.Text.UTF8Encoding($true)` 사용

---

## 1. 폴더 구조 룰

단일 페이지 대시보드이므로 feature 분리 대신 **역할(role) 기반** 구조 유지.

```
src/
  components/
    layout/       # 헤더 등 전체 레이아웃 (AppHeader)
    project/      # 프로젝트 카드, 모달, 태스크 패널
    team/         # 팀 오버레이, 멤버 툴팁
    timeline/     # 타임라인 패널
    viewer/       # 이미지 뷰어, 줌
  hooks/          # 커스텀 훅 (useFirebaseData)
  lib/            # 외부 서비스 초기화 (firebase.ts)
  services/       # API 호출 함수 — Firebase 연결 시 여기에 작성
  styles/         # App.css, index.css
  types/          # index.ts — 모든 타입 중앙 관리
public/
  images/
    bg/           # 배경 SVG
    team/         # 팀원 사진 (파일명 = 연락처 번호.jpg)
    icons/        # 아이콘 SVG
```

**금지**
- `utils/`, `common/`, `misc/`, `helpers/` 폴더 생성 금지
- 새 폴더 생성 전 기존 폴더에 넣을 수 있는지 먼저 검토

---

## 2. 컴포넌트 룰

- 하나의 컴포넌트는 하나의 책임만
- **300줄 초과 시 반드시 분리**
- Props는 `interface` 사용 (`type` 아님)
- `any` 금지 — `unknown` 사용
- 현재 프로젝트는 `default export` 사용 중 — 기존 패턴 유지

```tsx
// 올바른 예시
interface ProjectCardProps {
  project: Project;
  onSelect: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
  return (...)
}

export default ProjectCard;
```

---

## 3. 상태관리 룰

- **local state 우선** (`useState`) — 현재 전체 상태는 `App.tsx`에서 관리
- 전역 상태 최소화 — 현재 Context/Zustand 없음, 불필요하게 추가 금지
- Props Drilling **3단계 초과 금지** — 초과 시 컴포넌트 재설계 검토
- `filters` 상태 변경은 반드시 `AppHeader.tsx`의 `toggleFilter` 함수 패턴 사용

**미래 전환 시 참고 (현재 미적용)**
```
API 데이터    → React Query (TanStack Query)
UI 전역 상태  → Zustand
폼 상태       → React Hook Form
```

---

## 4. API / 서비스 룰

- `fetch` 직접 호출 금지 — `src/services/` 레이어 필수
- Firebase 함수 직접 컴포넌트에 작성 금지 — service 파일로 분리
- API 응답 타입은 `src/types/index.ts`에 정의

```ts
// services/projects.ts — Firebase 연결 시 이 패턴 사용
export async function getProjects(): Promise<Project[]> {}
export async function createProject(data: Omit<Project, 'id'>): Promise<void> {}
export async function updateProject(id: string, data: Partial<Project>): Promise<void> {}
export async function deleteProject(id: string): Promise<void> {}
```

**현재 mock**: `src/hooks/useFirebaseData.ts` — DB 연결 시 이 파일만 교체

---

## 5. 디자인 시스템 룰

**Raw 값 사용 금지, CSS Variable 사용 필수**

현재 정의된 변수 (`src/styles/App.css` `:root`):

```css
/* 배경/카드 */
--bg-beige: #f0ede6
--card-white: #ffffff
--border-light: #e5e2db

/* 브라운 계열 (브랜드 색상) */
--brown-dark: #3e332c
--brown-main: #684e42

/* 상태 색상 */
--red: #ff3b30       /* 삭제, 이슈 */
--orange: #ff9f0a    /* 보류 */
--yellow: #ffd60a
--green: #2e7d32     /* 진행 */
--blue: #1565c0
--grey: #6d645e

/* 텍스트 */
--text-main: #1e1b18
--text-muted: #8e8780
```

```css
/* 금지 */
color: #684e42;
background: #f0ede6;

/* 사용 */
color: var(--brown-main);
background: var(--bg-beige);
```

새 색상이 필요하면 `:root`에 변수 추가 후 사용.

---

## 6. 접근성(A11Y) 룰

- 모든 `<button>` 에 `title` 또는 `aria-label` 필수
- `<input>` 에 연결된 `<label>` 필수
- 키보드 네비게이션 지원 (`tabIndex`, `onKeyDown`)
- 색상만으로 상태 표현 금지 — 아이콘 또는 텍스트 병행

---

## 7. 성능 룰

- `React.memo`, `useMemo`, `useCallback` 남발 금지 — 실제 성능 문제 발생 시에만 사용
- 이미지는 `public/images/`에서 직접 경로 참조 (번들 포함 금지)
- 리스트 100개 초과 시 가상 스크롤 검토
- 코드 스플리팅: 패널/모달 등 무거운 컴포넌트는 `React.lazy` 적용 검토

---

## 8. 코드 스타일 룰

- TypeScript Strict Mode 준수
- `any` 금지 — `unknown` + 타입 가드 사용
- Magic Number 금지 — 상수로 추출

```ts
// 금지
setFilters(['all', '진행', '보류', '완료']);

// 사용
const ALL_FILTERS = ['all', '진행', '보류', '완료'] as const;
```

- 하드코딩 한국어 문자열 금지 — 상수 또는 props로 전달
- 주석은 한국어로 작성 (팀 내부 프로젝트)

---

## 9. AI 전용 룰 (필독)

### 새 파일 생성 전 체크리스트
1. 기존 컴포넌트를 재사용할 수 없는지 확인
2. `src/types/index.ts`에 이미 정의된 타입 확인
3. `src/styles/App.css`에 이미 있는 클래스 확인
4. 중복 컴포넌트 생성 금지

### 수정 시 원칙
- **최소 변경** — 요청한 부분만 수정, 관련 없는 코드 건드리지 않음
- 기존 CSS 클래스명 변경 금지
- 기존 네이밍 컨벤션 유지
- 수정 전 반드시 해당 파일 전체 구조 파악

### 절대 금지
- `src/assets/` 폴더에 파일 추가 (→ `public/images/` 사용)
- `App.tsx`에 UI 로직 인라인으로 추가 (→ 컴포넌트로 분리)
- CSS 파일 새로 생성 (→ 기존 `App.css`에 추가)
- `AppHeader.tsx` 우회하여 `App.tsx`에 헤더 JSX 직접 작성
- 불필요한 `console.log` 남기기
- Vite 8 OXC 파서: `import` 문을 함수/조건문 안에 작성

---

## 자주 수정하는 위치

| 항목 | 파일 | 위치 |
|------|------|------|
| 헤더 타이틀 | `src/components/layout/AppHeader.tsx` | 73번 줄 |
| 분기 라벨 | `src/components/layout/AppHeader.tsx` | 104번 줄 |
| CSS 변수 | `src/styles/App.css` | 3번 줄 `:root` |
| 팀원 데이터 | `src/hooks/useFirebaseData.ts` | mock 배열 |
| 프로젝트 타입 | `src/types/index.ts` | `Project` 타입 |
| 배경 이미지 경로 | `src/App.tsx` | 4~8번 줄 |
| Firebase config | `src/lib/firebase-applet-config.json` | 전체 |
