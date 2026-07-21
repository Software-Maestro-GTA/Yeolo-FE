---
name: pr-formatter
description: Standardize GitHub Pull Request title and description templates for Yeolo-FE.
---

# Pull Request Formatter Rule

에이전트가 이슈 개발 완료 후 GitHub Pull Request(PR) 본문 및 제목을 작성할 때 준수하는 서식 규칙입니다.

## 1. PR 제목 규격 (Pull Request Title)

PR 제목은 아래 서식에 맞추어 작성합니다.

```text
[Type] [Short Description] #(Issue Number)
```

- **Type**:
  - `[Feat]`: 새 기능 추가
  - `[Fix]`: 버그 수정
  - `[Design]`: UI/디자인 수정
  - `[Refactor]`: 코드 리팩토링
  - `[Docs]`: 문서 작성 및 수정
  - `[Test]`: 테스트 코드 작성/수정
  - `[Chore]`: 빌드/환경설정 작업
- **Short Description**: 한글 명사형 종결로 핵심 변경 내용 요약 (예: `여행 성향 프로필 조회 화면 구현`)
- **Issue Number**: 이슈 번호 (예: `#3`)

_예시_:

- `[Feat] 여행 성향 프로필 조회 화면 구현 #3`
- `[Fix] 로그인 토큰 만료 처리 에러 수정 #8`
- `[Refactor] 공통 API 및 Zustand 스토어 이관 #12`

---

## 2. PR 본문 마크다운 템플릿 (Pull Request Description)

```markdown
## 변경 사항

이 PR에서 무엇을 왜 변경했는지 요약해주세요.

1. **[주요 변경 항목 1]**: 상세 내용
2. **[주요 변경 항목 2]**: 상세 내용
3. **[주요 변경 항목 3]**: 상세 내용

## 관련 이슈

Closes #(이슈 번호)

## 변경 유형

- [ ] 버그 수정 (기존 동작을 바꾸지 않는 수정)
- [ ] 새 기능 (기존 동작을 바꾸지 않는 추가)
- [ ] 호환성 깨짐 (기존 동작이 바뀌는 변경)
- [ ] 문서 수정

## 체크리스트

- [ ] 코드 스타일 가이드를 따랐습니다
- [ ] 셀프 리뷰를 마쳤습니다
- [ ] 필요한 곳에 주석을 추가했습니다
- [ ] 문서를 업데이트했습니다
- [ ] 테스트를 추가/수정했고 통과합니다
```
