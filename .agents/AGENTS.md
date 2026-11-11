# Yeolo-FE Harness Project Map

여로(Yeolo)는 맞춤형 여행 코스 추천·일정 관리를 제공하는 프론트엔드 모노레포입니다.
이 문서는 프로젝트 진입점이며, 공통 운영 규칙은 [system.md](system.md)에서 관리합니다.
로컬 지침은 실행 환경의 상위 지침을 대체하지 않으며, 사용자 요청의 범위와 금지 사항을 지킵니다.

## 저장소 지도

- `packages/web/`: Next.js App Router, Tailwind CSS 웹 앱.
- `packages/app/`: Expo, React Native 모바일 앱.
- `packages/common/`: 공유 API, DTO, 상태 및 유틸리티.
- `.agents/Yeolo-SPEC/`: requirement-specs, functional-specs, domain-specs, api-specs, design-specs 명세. 관련 문서만 검색해 읽습니다.
- `.agents/agents/`: 역할별 작업 지침. 파일이 존재한다고 별도 에이전트가 자동 실행되지는 않습니다.
- `.agents/hooks/`: 명시적으로 실행하는 초기화·검증 스크립트.
- `.agents/skills/`, `.agents/templates/`: 상황별 규칙과 산출물 서식.
- 루트 `progress.md`, `log.md`: 로컬 진행 기록. Git에서 제외되므로 최종 답변에도 필요한 결과를 남깁니다. `.agents/` 아래 동명 파일은 사용하지 않습니다.

버전, 의존성, 사용 가능한 명령의 기준은 각 `package.json`과 실제 설정 파일입니다.
아래 명령은 **저장소 루트** 기준이며 패키지 관리에는 Yarn을 사용합니다.

| 대상 | 명령 | 실제 검증 범위 |
| --- | --- | --- |
| common | `yarn workspace @yeolo/common build` | 번들 및 타입 선언 생성 |
| common | `yarn workspace @yeolo/common lint` | TypeScript 검사 |
| web | `yarn workspace @yeolo/web lint --max-warnings=0` | ESLint |
| web | `yarn workspace @yeolo/web tsc --noEmit` | TypeScript 검사 |
| web | `yarn workspace @yeolo/web test --runInBand --passWithNoTests=false` | Jest; 테스트 미발견도 실패 |
| app | `yarn workspace @yeolo/app lint` | TypeScript 검사 (ESLint 아님) |
| app | `yarn workspace @yeolo/app test --runInBand --passWithNoTests=false` | Jest |
| 전체 | `yarn format:check` | Prettier 읽기 전용 검사 |
| 전체 | `bash .agents/hooks/test.sh` | 위 검사들을 실행; 제품 동작·배포 빌드 전체를 보장하지 않음 |

현재 `common:test`는 빌드의 별칭이며 common 단위 테스트를 실행하지 않습니다.
common 동작을 변경할 때는 해당 동작을 실행하는 테스트 경로·러너를 확인하고, 없으면 검증 공백을 보고합니다.
개발 서버는 web의 `dev`, app의 `start` 스크립트를 사용합니다. 배포·제출 명령은 검증용으로 실행하지 않습니다.

## 작업 흐름

1. `git status --short`와 관련 파일을 확인해 기존 변경을 보존합니다. 사용자 요청에서 완료 조건과 제외 범위를 정합니다.
2. 단순 문서·설정·스타일 수정은 직접 수정하고 적절한 정적 검사나 화면 확인으로 검증합니다. 형식적인 테스트나 진행 보드를 만들지 않습니다.
3. 기능·버그 수정은 [Planner](agents/planner.md) → [Tester](agents/tester.md) → [Coder](agents/coder.md) → [Reviewer](agents/reviewer.md) 순서의 책임을 수행합니다. 단일 에이전트가 역할을 순서대로 수행하는 것이 기본입니다.
4. 여러 단계의 작업은 [progress-manager](skills/progress-manager/SKILL.md)로 기록합니다. 기존 보드와 로그를 지우지 않습니다.
5. 별도 에이전트가 허용되고 독립 작업의 이점이 있을 때만 위임합니다. 파일 소유권을 나누고 주 에이전트만 공유 보드를 갱신합니다. 같은 파일을 동시에 편집하지 않습니다.
6. 하네스 개선 요청은 [Updater](agents/updater.md)를 적용합니다. 요청 자체가 해당 수정의 승인인 경우 다시 승인받지 않습니다.

## 스킬 선택

- 기능·명세 매핑: [yeolo-spec-matcher](skills/yeolo-spec-matcher/SKILL.md)
- 웹 / 앱 구현: [Next.js](skills/nextjs-app-router-guideline/SKILL.md) / [Expo](skills/expo-native-guideline/SKILL.md)
- API 테스트: [msw-api-mocking](skills/msw-api-mocking/SKILL.md)
- 코드 주석: [module-explain-formatter](skills/module-explain-formatter/SKILL.md)
- 상세 리뷰 보고서: [code-review-formatter](skills/code-review-formatter/SKILL.md)
- 요청된 커밋 / PR 작성: [git-commit-formatter](skills/git-commit-formatter/SKILL.md) / [pr-formatter](skills/pr-formatter/SKILL.md)
