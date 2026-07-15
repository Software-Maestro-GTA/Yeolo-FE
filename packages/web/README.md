# 🌐 @yeolo/web (Next.js Web Package)

여로(Yeolo)의 Next.js 기반 웹 플랫폼 서비스입니다.  
**Next.js App Router**와 **Tailwind CSS**를 채택하여 빠르고 현대적인 사용자 경험을 선사합니다.  
`@yeolo/common` 모듈을 연동하여 공통 API 정의와 타입 설정을 직접 활용합니다.

---

## 📂 폴더 구조

```text
packages/web/
├── src/
│   ├── app/          # Next.js App Router 페이지 구조 (layout, page, 등)
│   ├── components/   # 웹 서비스 전용 재사용 UI 컴포넌트
│   └── styles/       # Tailwind CSS 글로벌 테마 변수 및 globals.css 파일
├── public/           # 정적 서빙 에셋 (favicon, 폰트, 공통 리소스 등)
├── next.config.ts    # Next.js 환경 설정
├── package.json      # @yeolo/common 의존성 링크 포함
└── tsconfig.json
```

---

## 🚀 실행 및 배포 명령어

웹 패키지 단독 폴더 내 혹은 모노레포 루트 폴더에서 아래 명령어를 실행할 수 있습니다.

### 1. 개발용 로컬 서버 구동 (Dev)
```bash
# 최상위(Root) 폴더에서 호출 시
yarn web:dev

# packages/web 폴더 내부에서 실행 시
yarn dev
```
* **특징**: Next.js 16의 고속 컴파일 엔진인 **Turbopack**을 기본 번들러로 사용하여 기동합니다.

### 2. 프로덕션 빌드 (Build)
배포용 최적화 코드를 빌드합니다.
```bash
# 최상위(Root) 폴더에서 호출 시
yarn web:build

# packages/web 폴더 내부에서 실행 시
yarn build
```

### 3. 실서버 배포 기동 (Start)
빌드된 프로덕션 서버를 실행합니다.
```bash
# 최상위(Root) 폴더에서 호출 시
yarn web:start

# packages/web 폴더 내부에서 실행 시
yarn start
```
