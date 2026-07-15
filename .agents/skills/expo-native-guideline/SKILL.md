---
name: expo-native-guideline
description: Expo v57 및 React Native를 사용하는 모바일 앱 프로젝트 개발 규격 및 컴포넌트 가이드라인
---

# Expo & React Native 개발 규칙

이 프로젝트의 모바일 앱 패키지(`@yeolo/app`)는 **Expo v57** 및 **React Native**를 사용하여 구현됩니다. 에이전트는 코드 구현 및 리팩토링 시 아래 규칙을 반드시 준수해야 합니다.

## 1. 컴포넌트 설계 및 UI 구성 규칙
- **React Native 네이티브 컴포넌트 우선**:
  - 기본 레이아웃 구성 시 HTML 태그 대신 React Native 표준 컴포넌트(`<View>`, `<Text>`, `<Image>`, `<TouchableOpacity>` 등)를 사용합니다.
- **안전 영역 (Safe Area) 고려**:
  - 기기별 노치 및 물리 버튼 간섭을 배제하기 위해, 화면의 최상위 컨테이너 레이아웃 배치 시 `SafeAreaView` 또는 `expo-safe-area-context` 패키지를 적절히 가동합니다.

## 2. 스타일링 및 테마 규칙 (StyleSheet)
- **StyleSheet 활용**:
  - 인라인 스타일(`style={{ flex: 1, backgroundColor: 'red' }}`)을 피하고, 파일 하단에 `StyleSheet.create()`를 활용하여 스타일 객체를 명문화하여 격리합니다.
- **디자인 토큰 사용**:
  - 공통 색상 및 스페이싱 규격을 모노레포 내 글로벌 변수나 `@yeolo/common` 혹은 테마 설정에서 조회하여 통일성 있게 매핑합니다.

## 3. 편리한 코드 관리를 위한 규칙 (Clean Code)
- **컴포넌트 구조 통일**:
  - 화면 단위 파일은 `screens/` 혹은 `app/` 라우팅 폴더 내부에 위치시키고, 재사용 가능한 블록 UI는 `components/` 하위에 배치합니다.
- **비즈니스 로직과 UI 분리**:
  - 비동기 데이터 호출이나 로컬 디바이스 연동(카메라, 바이오인증 등) 코드는 화면 컴포넌트 안에 직접 넣지 않고, 커스텀 훅(`use[Feature].ts`)으로 분리하여 비즈니스 로직과 렌더링 뷰를 격리합니다.
- **엄격한 TypeScript 타입 지정**:
  - `any` 타입을 사용하지 않고, React Native의 Props 인터페이스와 `StyleProp<ViewStyle>` 등을 정확하게 지정하여 타입 캐스팅 에러를 예방합니다.
