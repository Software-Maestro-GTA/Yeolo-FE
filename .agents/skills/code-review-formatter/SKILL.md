---
name: code-review-formatter
description: 소스코드를 검증하고 피드백 루프를 돌 때 사용하는 정형화된 코드 리뷰 리포트 템플릿과 피드백 전달 규칙입니다.
---

# Code Review Formatter Skill (코드 리뷰 결과물 포맷 지침)

이 문서는 소스코드를 검증(테스트 및 정적 분석)하고 피드백을 전달할 때 사용하는 코드 리뷰 리포트 규격서입니다. 

리포트를 작성할 때는 임의의 서술 방식을 피하고, 프로젝트 루트의 `.agents/templates/review_report_template.md` 형식을 기본으로 하며, 발견된 문제점들은 아래의 **4대 오류 분류 체계**에 따라 구조적으로 작성해야 합니다.

---

## 4대 코드 오류 분류 체계 (Issue Categorization)

발견된 모든 문제점은 다음 4가지 카테고리로 엄격히 분류하여 기술합니다.

1. **`LINT` (스타일 및 정적 분석 오류)**:
   - ESLint 경고/에러, Prettier 포맷 불일치, 명명 규칙(Naming Convention) 위반 등.
2. **`TYPE` (타입 무결성 오류)**:
   - TypeScript 컴파일 실패, Interface 명세 불일치, `any` 타입의 무분별한 사용 등.
3. **`TEST` (테스트 실패 오류)**:
   - 단위 테스트(Unit test) 실패, MSW 모킹 예외 미통과, Given-When-Then 인수 조건 검증 실패 등.
4. **`LOGIC` (비즈니스 및 아키텍처 오류)**:
   - 기획 요구사항 누락, 예외 복구 흐름 부재, 설계상의 결함(디자인 토큰 위반 등).

---

## 피드백 작성 규칙 (Feedback Writing Guide)

Reviewer 에이전트는 반려 시 `review_report_template.md` 형식을 복사하여 `log.md`를 구성하고, **"3. 피드백 및 조치 사항"**의 **"반려 시 수정 요구사항"** 영역에 다음과 같은 구조화된 형태로 피드백을 수록합니다.

```markdown
- **[카테고리: LINT/TYPE/TEST/LOGIC] - [간략한 오류 내용]**
  - **발생 파일 및 위치**: [파일명.ts](./packages/상대경로/파일명.ts#L라인번호)
  - **문제 현상**: [에러 메시지나 문제가 되는 코드 라인을 구체적으로 설명합니다.]
  - **해결 가이드**: [어떻게 코드를 고쳐야 테스트를 통과할 수 있는지 해결 방안을 구체적인 예시 코드와 함께 제시합니다.]
```

### 올바른 피드백 작성 예시:
```markdown
- **[TEST] - 이메일 중복 검증 시 409 Conflict 미처리**
  - **발생 파일 및 위치**: [authStore.test.ts](./packages/web/__tests__/authStore.test.ts#L45)
  - **문제 현상**: 이메일 중복 회원 가입 요청 시 백엔드 응답 `409 Conflict`에 대한 UI 및 훅 에러 복구 로직이 구현되지 않아 테스트가 실패함.
  - **해결 가이드**: `packages/web/src/hooks/useAuth.ts`에서 catch 블록 내부의 `error.status === 409` 분기를 추가하여 `isDuplicated` 상태를 `true`로 셋업하도록 수정하시오.
```
