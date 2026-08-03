# 여로

초개인화 여행 플랫폼 '여로'의 프론트엔드 모노레포 저장소입니다.  
Yarn Workspaces를 활용하여 웹(Web)과 모바일 앱(App) 환경의 공통 비즈니스 로직 및 API 인터페이스를 공유합니다.

---

## 프로젝트 구조

```text
yeolo-fe/
├── packages/
│   ├── common/         # 공통 비즈니스 로직, API 클라이언트 및 데이터 타입 정의
│   ├── web/            # Next.js (App Router) + Tailwind CSS 기반 웹 서비스
│   └── app/            # React Native (Expo) 기반 모바일 앱
├── package.json        # 루트 워크스페이스 설정 및 빌드/실행 스크립트
└── yarn.lock
```

---

## 개발 환경 설정

### 의존성 설치 및 모듈 빌드

```bash
# 워크스페이스 전체 의존성 설치
yarn install

# 공통 모듈 선행 빌드 (앱 및 웹 실행 전 필수)
yarn workspace @yeolo/common build
```

---

## 실행 및 빌드 명령어

| 플랫폼      | 명령어             | 비고                                   |
| :---------- | :----------------- | :------------------------------------- |
| **Web**     | `yarn web:dev`     | Next.js 개발 서버 실행 (port 3000)     |
| **Android** | `yarn android:dev` | Expo Android 에뮬레이터/기기 연결 실행 |
| **iOS**     | `yarn ios:dev`     | Expo iOS 시뮬레이터 실행 (macOS 전용)  |

## 서브 패키지 안내

- 공통 모듈: [packages/common/README.md](./packages/common/README.md)
- 웹 서비스: [packages/web/README.md](./packages/web/README.md)
- 모바일 앱: [packages/app/README.md](./packages/app/README.md)
