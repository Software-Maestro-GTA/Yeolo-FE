---
name: expo-native-guideline
description: Expo v57 및 React Native를 사용하는 모바일 앱 프로젝트 개발 규격 및 컴포넌트 가이드라인
---

# Expo & React Native 개발 규칙

이 프로젝트의 모바일 앱 패키지(`@yeolo/app`)는 **Expo v57** 및 **React Native**를 사용하여 구현됩니다. 모든 에이전트(Coder, Tester, Reviewer)는 모바일 소스 구현 및 테스트 작성 시 아래 규칙을 반드시 준수해야 합니다.

---

## 1. JSDoc 헤더 주석 작성 규격 (Mandatory)

새로 생성하거나 수정한 모든 TS/TSX 파일 상단에는 [`module-explain-formatter`](../module-explain-formatter/SKILL.md) 지침에 따른 JSDoc 헤더 주석을 필수로 포함합니다.

```tsx
/**
 * @file CourseCard.tsx
 * @description 코스 리스트 및 상세 화면에서 사용되는 여행 코스 요약 카드 컴포넌트
 * @requirements REQ-11, REQ-12
 * @functional FUN-4
 * @author Coder Agent
 */
```

---

## 2. 컴포넌트 설계 및 UI 구성 규칙

- **React Native 네이티브 컴포넌트 우선**:
  - 기본 레이아웃 구성 시 HTML 태그 대신 React Native 표준 컴포넌트(`<View>`, `<Text>`, `<Image>`, `<TouchableOpacity>`, `<Pressable>` 등)를 사용합니다.
- **안전 영역 (Safe Area) 및 키보드 고려**:
  - `react-native-safe-area-context`의 `useSafeAreaInsets()` 또는 `SafeAreaView`를 사용해 노치 및 하단 바 간섭을 방지합니다.
  - 폼 입력 UI 구현 시 `KeyboardAvoidingView` 및 `TouchableWithoutFeedback` + `Keyboard.dismiss()`를 사용하여 키보드 가림 문제를 방지합니다.
- **Figma MCP 선제 조회**:
  - Figma MCP가 연결된 경우 `get_design_context` 및 `get_screenshot`을 실행하여 색상, 폰트, 간격 명세를 선제 추출 후 일치시킵니다.

---

## 3. 스타일링, 테마 및 문자열 관리 규칙

- **`StyleSheet.create` 사용 필수 (인라인 스타일 금지)**:
  - 파일 하단에 `StyleSheet.create()`로 스타일 객체를 격리합니다.
- **디자인 토큰 사용 (`theme.colors`)**:
  - 하드코딩된 `#Hex` 색상 사용을 금지하고 `theme/colors.ts`에 정의된 `theme.colors` 토큰을 사용합니다.
- **중앙 상수 통제 (`UI_STRINGS` & `APP_CONFIG`)**:
  - UI 텍스트는 `constants/strings.ts` (`UI_STRINGS`), 시스템 설정값 및 더미 데이터는 `constants/config.ts` (`APP_CONFIG`)에서 관리합니다.
  - 환경 변수는 `process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL`과 같이 `@yeolo/common`을 연동합니다.

### ❌ Bad (금지 사례)
```tsx
// ❌ 하드코딩된 Hex 색상, 인라인 스타일, 하드코딩된 텍스트
<View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 16 }}>
  <Text style={{ fontSize: 18, color: '#333333' }}>여행 일정 생성하기</Text>
</View>
```

### ✅ Good (권장 사례)
```tsx
// ✅ theme.colors, UI_STRINGS, StyleSheet 객체 활용
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/colors';
import { UI_STRINGS } from '../constants/strings';

export function CourseCreateHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{UI_STRINGS.CREATE_COURSE_TITLE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.subtitle.fontSize,
    color: theme.colors.textPrimary,
  },
});
```

---

## 4. 서비스 계층 및 `@yeolo/common` 연동 규칙

- **비즈니스 로직 및 서비스 계층 격리**:
  - EXIF 사진 파싱, 위치 변환 등 비 UI 비즈니스 연동 함수는 `services/` (`photoService.ts`, `courseService.ts`) 또는 커스텀 훅(`hooks/`)으로 캡슐화합니다.
- **`@yeolo/common` 우선 연동 (API & Store)**:
  - API 요청 함수 및 Zustand 전역 상태는 App 내부에서 재작성하지 않고, `@yeolo/common` 패키지의 API(`common/src/api/`) 및 스토어(`common/src/store/`)를 **최우선 import**하여 사용합니다.
- **`fetcher` Prop 전달 금지**:
  - 커스텀 훅이나 컴포넌트에 `fetcher` 함수를 Prop으로 전달받지 않고 `@yeolo/common` API 함수를 직호출합니다.
- **리스트 가상화 (Virtualization)**:
  - 리스트 뷰 구현 시 `ScrollView.map` 대신 `FlatList`를 사용하며, `keyExtractor` 및 `React.memo`를 활용해 불필요한 리렌더링을 차단합니다.

---

## 5. 단위 테스트 격리 및 네이티브 모킹 규칙 (RNTL)

- **테스트 헬퍼 위치**:
  - `test-utils` 등 테스트 전용 헬퍼 파일은 `src/`가 아닌 `__tests__/` 디렉토리에 배치합니다.
- **단위 테스트 내 직접 모듈 경로 Import 의무화**:
  - Barrel export(`../src/screens`) 참조 시 un-mocked 네이티브 모듈이 로드되어 테스트 실패가 발생할 수 있습니다. 반드시 **개별 파일 경로를 직접 import**해야 합니다.
- **네이티브 SDK 모킹 준수 (`jest.setup.js`)**:
  - `AsyncStorage`, `react-native-maps`, `react-native-webview`, `expo-media-library`, `google-signin` 등 네이티브 SDK 모듈은 `jest.setup.js`에 가짜 객체(Mock)로 등록하여 독립된 실행 환경을 보장합니다.

### ❌ Bad (금지 사례)
```tsx
// ❌ Barrel Export 참조로 인한 네이티브 모듈 미모킹 부작용 유발
import { CourseDetailScreen } from '../src/screens';
```

### ✅ Good (권장 사례)
```tsx
// ✅ 개별 파일 직접 참조로 테스트 격리 유지
import { CourseDetailScreen } from '../src/screens/CourseDetailScreen';
```

---

## 6. 에이전트 자가 검증 체크리스트 (Agent Checklist)

Coder/Tester 에이전트는 코드 작성 완료 전 다음 체크리스트를 확인합니다:

- [ ] 최상단에 `module-explain-formatter` JSDoc 헤더 주석이 작성되었는가?
- [ ] 인라인 스타일이나 하드코딩된 Hex 색상이 없는가? (`theme.colors` 사용 여부)
- [ ] UI 하드코딩 문자열이 `UI_STRINGS`로 분리되었는가?
- [ ] API 요청 및 Zustand 전역 스토어가 `@yeolo/common`에서 수입되었는가?
- [ ] 단위 테스트(`__tests__/*.test.tsx`)에서 개별 파일 직접 import를 사용하고 있는가?
- [ ] `yarn workspace @yeolo/app tsc --noEmit` 실행 시 타입 에러가 없는가?

