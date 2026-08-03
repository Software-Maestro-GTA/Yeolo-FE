# @yeolo/app

여로(의 React Native (Expo) 기반 모바일 앱 패키지입니다.  
공통 모듈인 `@yeolo/common`과 연동하여 통합 비즈니스 로직을 사용합니다.

---

## 폴더 구조

```text
packages/app/
├── src/
│   ├── components/   # 앱 공통 및 도메인별 UI 컴포넌트
│   ├── context/      # 인증 및 전역 상태 콘텍스트
│   ├── hooks/        # React Query 및 커스텀 훅
│   ├── navigation/   # 라우팅 및 네비게이션 정의
│   ├── screens/      # 화면 컴포넌트 (Home, Login 등)
│   ├── services/     # Native SDK 및 세션 유틸리티
│   └── App.tsx       # 모바일 앱 메인 컴포넌트
├── assets/           # 아이콘 및 스플래시 이미지 에셋
├── app.config.js     # Expo 동적 설정 파일
├── app.json          # Expo 앱 전역 설정 및 메타데이터
├── eas.json          # EAS 빌드 프로필 설정
└── package.json
```

---

## 개발 모드 실행

개발 서버 실행 전 Android 에뮬레이터 또는 iOS 시뮬레이터가 기동되어 있어야 합니다.

```bash
# packages/app 디렉터리 내에서 실행 시

# Android 개발 모드 실행
yarn android

# iOS 개발 모드 실행 (macOS 전용)
yarn ios
```
