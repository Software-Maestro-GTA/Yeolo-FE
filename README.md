# 🧭 여로 (Yeolo) - Frontend Monorepo

제로터치 초개인화 여행 플랫폼 **'여로(Yeolo)'**의 프론트엔드 통합 저장소입니다.  
본 프로젝트는 **Yarn Workspaces**를 활용한 모노레포(Monorepo) 구조로 설계되어, 웹(Web)과 모바일 앱(App) 사이에서 공통 비즈니스 로직 및 API 코드를 효율적으로 공유합니다.

---

## 📂 프로젝트 구조 (Monorepo Workspace)

```text
yeolo-fe/
├── packages/
│   ├── common/         # [Core] 공통 비즈니스 로직, API 클라이언트, 상태 관리 스토어 및 타입 정의
│   ├── web/            # [Web] Next.js (App Router) + Tailwind CSS 기반 웹 서비스
│   └── app/            # [App] React Native (Expo) 기반 하이브리드 모바일 앱
├── package.json        # 루트 워크스페이스 설정 및 공통 매핑 스크립트
└── yarn.lock
```

---

## 🚀 최상위 실행 명령어 (CLI Commands)

프로젝트 루트(최상위 폴더)에서 아래의 명령어를 통해 각 플랫폼을 실행하고 빌드할 수 있습니다.

### 1. 초기 설정 및 의존성
```bash
# 전체 워크스페이스 의존성 패키지 설치
yarn install

# 공통(common) 모듈 선행 빌드 (앱/웹 실행 전에 반드시 실행 필요)
yarn workspace @yeolo/common build
```

### 2. 플랫폼별 실행 스크립트

| 실행 플랫폼 | 작업 | 명령어 | 실제 실행 스크립트 |
| :--- | :--- | :--- | :--- |
| **Web** | 개발 모드 실행 | `yarn web:dev` | `next dev` (Turbopack) |
| | 빌드 (배포용) | `yarn web:build` | `next build` |
| | 빌드 후 서버 시작 | `yarn web:start` | `next start` |
| **Android** | 개발 모드 실행 | `yarn android:dev` | `expo start --android` |
| | 릴리즈 빌드 | `yarn android:build` | `expo run:android --variant release` |
| **iOS** (macOS 전용) | 개발 모드 실행 | `yarn ios:dev` | `expo start --ios` |
| | 릴리즈 빌드 | `yarn ios:build` | `expo run:ios --configuration Release` |

---

## 🛠️ 서브 패키지 상세 안내

각 패키지별 상세 설정 및 디렉토리 구조는 하단의 개별 README를 참고해 주세요.
* 📦 공통 모듈: [packages/common/README.md](./packages/common/README.md)
* 🌐 웹 서비스: [packages/web/README.md](./packages/web/README.md)
* 📱 모바일 앱: [packages/app/README.md](./packages/app/README.md)
