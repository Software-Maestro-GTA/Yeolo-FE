# 📱 @yeolo/app (React Native / Expo Package)

여로(Yeolo)의 **React Native (Expo)** 기반 모바일 하이브리드 앱 프로젝트입니다.  
하나의 코드베이스로 Android와 iOS 애플리케이션을 모두 빌드하며, 공통 Core 패키지인 `@yeolo/common`과 연동되어 핵심 비즈니스 로직을 활용합니다.

---

## 📂 폴더 구조

```text
packages/app/
├── src/
│   ├── components/   # 앱 전용 공통 UI 컴포넌트 (Button, Input 등)
│   ├── screens/      # 앱 화면 단위 컴포넌트 (LoginScreen, HomeScreen 등)
│   ├── navigation/   # Stack/Tab Navigator 등 화면 간 이동 경로 및 흐름 정의
│   └── App.tsx       # 모바일 앱 메인 컴포넌트
├── assets/           # 앱 아이콘, 스플래시 화면 등 하드웨어 설정 관련 고정 에셋
├── index.ts          # Expo 앱 기동 엔트리 포인트
├── app.json          # Expo 앱 전역 빌드 및 메타데이터 설정 파일
├── metro.config.js   # 모노레포 환경을 지원하는 Metro 번들러 설정 파일
├── package.json      # @yeolo/common 의존성 링크 포함
└── tsconfig.json
```

---

## 🚀 실행 및 빌드 명령어

원활한 구동을 위해 Android Studio 에뮬레이터 또는 Xcode iOS 시뮬레이터가 PC에 사전에 세팅 및 가동 중이어야 합니다.

### 1. Android 실행 및 빌드

| 작업 내용 | 최상위(Root) 폴더 명령어 | 개별 app 폴더 명령어 |
| :--- | :--- | :--- |
| **개발 모드 구동** | `yarn android:dev` | `yarn android` |
| **로컬 릴리즈 빌드** | `yarn android:build` | `yarn android:build` |

* **개발 모드**는 로컬 Expo Go 앱을 통해 QR 스캔으로 실물 기기 테스트도 가능합니다.
* **릴리즈 빌드** 시 안드로이드 빌드 모듈이 컴파일되어 APK/AAB 아웃풋 준비 프로세스가 진행됩니다.

### 2. iOS 실행 및 빌드 (macOS 전용)

| 작업 내용 | 최상위(Root) 폴더 명령어 | 개별 app 폴더 명령어 |
| :--- | :--- | :--- |
| **개발 모드 구동** | `yarn ios:dev` | `yarn ios` |
| **로컬 릴리즈 빌드** | `yarn ios:build` | `yarn ios:build` |
