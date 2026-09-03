---
name: module-explain-formatter
description: Standardize docstrings and header comments for newly created or modified files.
---

# Module Explain Formatter Rule

코더 에이전트(`coder.md`)가 새로운 파일(코드 모듈)을 생성하거나 기존 소스 코드를 수정할 때, 파일 상단에 모듈의 설명과 책임을 기록하는 문서 주석 표준입니다.

## 1. 파일 헤더 주석 템플릿 (File Header Docstring)

모든 소스 코드 파일(JavaScript, TypeScript, JSX)의 최상단에는 아래 형식의 헤더 주석이 반드시 포함되어야 합니다.

### JavaScript 및 React 컴포넌트 예시:

```javascript
/**
 * @file [파일명]
 * @description [모듈의 핵심 목적 및 담당 기능 간략 설명]
 */
```

## 2. 함수 및 인터페이스 문서화 (Function Docstring)

모듈 외부로 export되는 주요 함수나 컴포넌트에는 입력(Parameter)과 출력(Return) 타입 및 역할을 정의해 줍니다.

- 파라미터의 이름, 타입, 설명 명시.
- 반환 값의 타입 및 에러 발생 시 예외 타입 기술.
- 에이전트 간의 통신 시, 다른 에이전트가 이 주석을 기반으로 Mocking 및 테스트 스펙을 설계할 수 있도록 명확히 작성해야 합니다.
