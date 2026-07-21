---
name: nextjs-app-router-guideline
description: Next.js App Router와 Tailwind CSS v4를 사용하는 웹 프로젝트 개발 규격 및 컴포넌트 설계 가이드라인
---

# Next.js App Router & Tailwind CSS v4 개발 규칙

이 프로젝트의 웹 패키지(`@yeolo/web`)는 **Next.js 16 (App Router)** 및 **Tailwind CSS v4**를 사용하여 구현됩니다. 에이전트는 코드 구현 및 리팩토링 시 아래 규칙을 반드시 준수해야 합니다.

## 1. 컴포넌트 설계 및 분류 규칙
- **서버 컴포넌트 (Default)**:
  - `src/app/` 내부의 모든 페이지 및 기본 레이아웃은 기본적으로 서버 컴포넌트로 생성합니다.
  - 데이터 패칭 및 API 호출은 가능하면 서버 컴포넌트 수준에서 비동기(`async/await`)로 처리하여 하위 컴포넌트에 Props로 전달합니다.
- **클라이언트 컴포넌트 (`use client`)**:
  - `useState`, `useEffect`, `useContext` 등의 리액트 훅을 사용하거나, 이벤트 리스너(클릭, 입력 등)가 필요한 인터랙티브 UI는 파일 최상단에 반드시 `'use client'` 지시어를 명시합니다.
  - 불필요하게 거대한 컴포넌트 전체를 클라이언트 컴포넌트로 만들지 말고, 인터랙션이 발생하는 최소 단위로 쪼개어 서버 컴포넌트 하위에 결합합니다.

## 2. Tailwind CSS v4 스타일링 규칙
- **인라인 하드코딩 금지**: 색상 코드(예: `#4f46e5`)나 크기 값(예: `13px`)을 개별 스타일로 직접 하드코딩하지 않습니다.
- **디자인 토큰 사용**: 테마와 일관성을 위해 설정된 Tailwind 테마 변수를 활용합니다.
  - 예: `bg-primary`, `text-secondary`, `rounded-md` 등
- **반응형 디자인 설계**: 모바일 우선(Mobile-First) 디자인 원칙에 입각하여 `sm:`, `md:`, `lg:` 접두사를 활용해 모든 해상도에서 균형 있는 UI를 구성합니다.

## 3. 편리한 코드 관리를 위한 규칙 (Clean Code)
- **컴포넌트 구조 통일**:
  - 각 UI 컴포넌트는 `components/[ComponentName]/` 폴더 아래에 생성하고, 핵심 로직은 `[ComponentName].tsx`에 작성합니다.
  - `components/[ComponentName]/index.ts`를 생성하여 외부로의 export 경로를 일원화합니다.
- **비즈니스 로직과 UI 분리 및 모노레포 재사용**:
  - 컴포넌트 내부가 비대해지는 것을 방지하기 위해 복잡한 상태 관리 및 API 연동 로직은 커스텀 훅으로 분리하되, **웹과 앱이 공유하는 API 요청 함수 및 Zustand 전역 상태는 `@yeolo/common` 패키지의 API(`common/src/api/`) 및 스토어(`common/src/store/`)를 선제 활용**합니다.
- **엄격한 TypeScript 타입 지정**:
  - `any` 타입을 임의로 사용하지 않고, 모든 Props와 API 응답에 대해 명확한 `interface` 또는 `type`을 지정합니다.
  - 공통으로 사용되는 비즈니스 데이터 모델은 `@yeolo/common` 패키지의 정의를 가져와 공유합니다.
