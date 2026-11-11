---
name: yeolo-spec-matcher
description: 제품 기능이나 버그의 요구사항을 .agents/Yeolo-SPEC의 관련 명세에 연결합니다.
---

# Yeolo Spec Matcher

- 저장소 루트의 `.agents/Yeolo-SPEC/`에서 `rg`로 관련 키워드와 명세 ID를 검색합니다. 하네스·문서 유지보수에 제품 명세 매핑을 강제하지 않습니다.
- 해당 기능의 `requirement-specs/REQ-*.md`와 `functional-specs/FUN-*.md`를 읽고 관찰 가능한 인수 기준을 추출합니다.
- 데이터 변경은 `domain-specs/`, API 연동은 `api-specs/`, 디자인 작업은 `design-specs/`의 관련 문서만 추가로 읽습니다.
- ID 번호가 같은 문서끼리 자동으로 대응한다고 가정하지 않습니다. 문서 내용과 실제 참조를 확인합니다.
- 명세를 요청 없이 수정하지 않습니다. 문서 간 충돌이나 구현과의 차이, 명세가 없는 부분을 명시하고 없는 경로·ID·정책을 만들지 않습니다.
- 보드를 사용하는 경우 루트 `progress.md`에서 해석되는 링크를 적습니다. 예: `[REQ-1](.agents/Yeolo-SPEC/requirement-specs/REQ-1.md)`. Markdown 파일 내부 링크는 해당 파일 위치를 기준으로 작성합니다.
- 인수 기준마다 관련 명세, 검증할 사용자 동작, 검증 방법을 연결합니다.
