# 📦 @yeolo/common (Core Module)

여로(Yeolo) 서비스의 핵심 비즈니스 로직과 웹(Web), 앱(App) 플랫폼에서 공유하는 공통 자원을 관리하는 핵심 패키지입니다.  
TypeScript 환경으로 구성되어 있으며, **tsup** 번들러를 통해 ESM 및 CJS 두 가지 포맷의 자바스크립트 라이브러리로 빌드됩니다.

---

## 📂 폴더 구조

```text
packages/common/
├── src/
│   ├── api/          # Axios, React Query 등을 사용하는 API 통신 클라이언트 및 정의
│   ├── constants/    # 앱/웹 공통 사용 상수 (환경 변수 키, 고정 코드값 등)
│   ├── hooks/        # React 기반 플랫폼에서 재사용 가능한 공통 커스텀 훅
│   ├── store/        # 공통 전역 상태 관리 스토어 (Zustand, Redux 등)
│   ├── types/        # TypeScript 공통 인터페이스 및 타입 정의
│   ├── utils/        # 공통 순수 함수 및 유틸리티 (날짜 포맷팅, 데이터 변환 등)
│   └── index.ts      # 모든 하위 모듈을 취합하여 외부로 노출하는 메인 진입점
├── package.json      # 빌드 도구(tsup) 및 typescript 설정 정의
└── tsconfig.json
```

---

## 🚀 빌드 명령어

웹이나 앱 패키지를 정상적으로 실행 및 빌드하려면, 이 패키지가 먼저 빌드되어 `dist/` 폴더 내에 컴파일된 파일이 생성되어 있어야 합니다.

### 1. 패키지 단독 빌드
```bash
# packages/common 폴더 내부에서 실행 시
yarn build
```

### 2. 최상위(Root) 폴더에서 호출 시
```bash
yarn workspace @yeolo/common build
```

빌드가 완료되면 루트에 `dist/` 폴더가 생성되고, 그 하위에 `index.js`(CommonJS), `index.mjs`(ESModule) 및 타입 선언 파일인 `index.d.ts`가 성공적으로 추출됩니다.
