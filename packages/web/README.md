# @yeolo/web

여로(Yeolo)의 Next.js 기반 웹 서비스 패키지입니다.  
Next.js App Router와 Tailwind CSS를 활용하며, `@yeolo/common` 모듈과 연동하여 공통 API 및 타입 정의를 공유합니다.

---

## 폴더 구조

```text
packages/web/
├── src/
│   ├── app/          # Next.js App Router 페이지 및 레이아웃 구조
│   ├── components/   # 웹 서비스 전용 재사용 UI 컴포넌트
│   └── styles/       # Tailwind CSS 및 전역 스타일 시트
├── public/           # 정적 파일 (파비콘, 이미지 등)
├── next.config.ts    # Next.js 환경 설정
├── package.json
└── tsconfig.json
```

---

## 실행 및 배포 명령어

### 1. 개발용 로컬 서버 실행 (Dev)

```bash
# 최상위(Root) 폴더에서 실행 시
yarn web:dev

# packages/web 폴더 내에서 실행 시
yarn dev
```

Next.js 16의 Turbopack 번들러를 통해 개발 서버를 가동합니다.

### 2. 프로덕션 빌드 (Build)

```bash
# 최상위(Root) 폴더에서 실행 시
yarn web:build

# packages/web 폴더 내에서 실행 시
yarn build
```

### 3. 프로덕션 서버 실행 (Start)

```bash
# 최상위(Root) 폴더에서 실행 시
yarn web:start

# packages/web 폴더 내에서 실행 시
yarn start
```
