# Harness Engineering Project Map (AGENTS.md)

이 문서는 초개인화 여행 플랫폼 **여로(Yeolo)**의 프론트엔드 모노레포 프로젝트 아키텍처, 의존성, 다중 에이전트 협업 파이프라인 및 개발 규율을 정의한 **공통 지침서**입니다. 프로젝트에 참여하는 모든 에이전트와 개발자는 작업을 시작하기 전 본 문서를 숙독하고 반드시 준수해야 합니다.

---

## 1. 프로젝트 개요 및 목적

- **명칭**: 여로(Yeolo) 프론트엔드 모노레포 애플리케이션
- **목적**: 사용자의 관심사 및 여행 성향을 분석하여 맞춤형 여행 코스 추천, 일정 보관, 생성 이력 조회 등의 모바일 앱 및 웹 환경을 원스톱 제공하는 초개인화 여행 플랫폼을 구축합니다.
- **하네스 엔지니어링 지향점**: 모노레포 패키지들의 안정적인 결합 및 비즈니스 명세 일치를 위해 다중 에이전트 기반 자율 TDD 루프(Planner ➜ Tester ➜ Coder ➜ Reviewer)를 활용해 개발의 신뢰성과 생산성을 극대화합니다.

---

## 2. 프로젝트 폴더 구조 (Directory Structure)

하네스 시스템이 대상 프로젝트에 삽입될 때 구축되는 전체 프로젝트 레이아웃입니다. 하네스의 코어 소스들은 대상 프로젝트 루트 하위의 `.agents/` 디렉토리에 통합 보관되어 구동됩니다:

```
Yeolo-FE (대상 프로젝트 루트)
├── packages/                     # Yarn Workspaces 기반 프론트엔드 모노레포 패키지
│   ├── web/                      # Next.js 16 (App Router) + Tailwind CSS v4 웹 서비스
│   ├── app/                      # Expo v57 + React Native 모바일 앱 서비스
│   └── common/                   # 웹과 앱에서 공유하는 공통 데이터 모델 및 빌드 유틸리티
├── .agents/                      # 하네스 오케스트레이션 및 에이전트 규칙 저장소
│   ├── agents/                   # 다중 에이전트(Planner, Tester, Coder, Reviewer, Updater) 역할 프롬프트 (.md)
│   ├── hooks/                    # 빌드 및 테스트 자동 검증 훅 스크립트 (init.sh, test.sh)
│   ├── skills/                   # API 모킹, 커밋 메시지 규격, 프레임워크 가이드 등 개별 실행 규칙
│   ├── templates/                # progress.md, 모듈 주석, 검증 리포트 작성용 템플릿
│   ├── specs/                    # Given-When-Then 요구사항 및 기능 명세서 보관소
│   └── system.md                 # 전역 에이전트 절대 제약 가이드라인 (System Rules)
├── progress.md                   # 전체 에이전트의 기동 상황 및 할 일을 기록하는 진척 보드
└── log.md                        # 전체 에이전트의 무결성 검증 실패 내역을 누적하는 실행 로그 보드
```

---

## 3. 개발 환경 및 기술 스택 (Environments & Dependencies)

### 3.1 모노레포 공통 영역 (`packages/common/`)

- **런타임 및 패키지 매니저**: Node.js / `yarn` (Yarn Workspaces 사용)
- **빌드 도구**: TypeScript
- **빌드 명령어**: `yarn workspace @yeolo/common build`

### 3.2 Web 애플리케이션 영역 (`packages/web/`)

- **포트 번호**: `3000` (개발 기동: `yarn workspace @yeolo/web dev`)
- **프레임워크**: Next.js 16 (TypeScript, App Router 기반)
- **스타일링**: Tailwind CSS v4
- **테스트 러너**: Jest
- **테스트 유틸리티**: React Testing Library (RTL)
- **API 모킹**: Mock Service Worker (MSW)
- **테스트 명령어**: `yarn workspace @yeolo/web test`

### 3.3 App (Mobile) 애플리케이션 영역 (`packages/app/`)

- **포트 번호**: `8081` (개발 기동: `yarn workspace @yeolo/app start`)
- **프레임워크**: Expo v57 / React Native (TypeScript)
- **스타일링**: React Native StyleSheet
- **테스트 러너**: Jest
- **테스트 유틸리티**: React Native Testing Library (RNTL)
- **테스트/빌드 명령어**: `yarn workspace @yeolo/app test` 또는 TypeScript 컴파일 체크 (`yarn workspace @yeolo/app tsc --noEmit`)

---

## 4. 다중 에이전트 협업 워크플로우 (Multi-Agent Workflow)

본 프로젝트는 4개 에이전트가 역할을 교대하며 작업을 완수해 나가는 자율 TDD 이중 루프(Double-Loop)로 진행되며, 사후 개선 에이전트가 개선 패치를 지원합니다.

### 4.1 에이전트별 역할 및 구동 파일

1.  **[Planner](./agents/planner.md)**:
    - 기동 직후 `sh hooks/init.sh`를 실행하여 진척 보드(`progress.md`)와 로그를 초기화합니다.
    - 사용자가 지정한 이슈를 분석하고, `.agents/specs/` 하위 명세를 매핑합니다.
    - `progress_template.md`를 바탕으로 `progress.md` 파일 초기화 및 인수 기준(Acceptance Criteria) 작성을 수행합니다.
2.  **[Tester](./agents/tester.md)**:
    - 기능 구현이 진행되기 전, `progress.md`에 설정된 인수 기준을 검증하는 실패하는 단위 테스트 코드(Red Phase) 및 MSW 모킹 핸들러를 먼저 작성합니다.
    - 소스코드 경로: `packages/`
3.  **[Coder](./agents/coder.md)**:
    - 실패하는 테스트 코드를 통과시키는 비즈니스 로직과 화면 스타일을 구현합니다.
    - **테스트 코드를 임의 수정/완화하는 것은 엄격히 금지**됩니다. 파일 헤더에는 `module-explain-formatter` 주석을 추가합니다.
4.  **[Reviewer](./agents/reviewer.md)**:
    - 검증 훅인 `sh hooks/test.sh`를 구동하여 테스트 및 린트 결과(exit code)를 검증합니다.
    - 실패 시 에러 로그를 `log.md`에 상세 기입하고 개발 에이전트(Coder 또는 Tester)로 반려 피드백 리포트를 발행하고 롤백합니다.
    - 성공 시 `progress.md`를 최종 완료(DONE) 마킹하고 전체 파이프라인 작업을 끝마칩니다.
5.  **[Updater](./agents/updater.md)**:
    - 사용자의 질의 응답 완료 후 기동하여 하네스 개선이 필요하다고 판단 시, 사용자에게 변경 전후 diff를 제시하여 명시적 승인을 얻은 후 `agents/`, `hooks/`, `skills/` 등의 코어 인프라를 안전하게 개선합니다.

---

## 5. 필수로 준수해야 하는 공통 규칙 (Global Rules)

1.  **전역 운영 규칙 준수**:
    - [system.md](./system.md)에 기술된 제약 조건을 최우선 준수합니다. (CLI 우선 작업 표준, 테스트 없는 코딩 금지, 모노레포 아키텍처 보존 등)
2.  **스킬 지침서 준수**:
    - 화면 개발([Next.js](./skills/nextjs-app-router-guideline/SKILL.md), [Expo](./skills/expo-native-guideline/SKILL.md)), [API 모킹](./skills/msw-api-mocking/SKILL.md), [문서 주석](./skills/module-explain-formatter/SKILL.md), [커밋 메시지](./skills/git-commit-formatter/SKILL.md), [PR 포맷](./skills/pr-formatter/SKILL.md) 등 상황별 전용 스킬 규칙을 적용합니다.

---

## 6. 에러 상황 및 예외 처리 (Error Handling & Escalation)

- **TDD 최대 루프 초과 시 대처**:
  - `max_tdd_loops`(기본 5회)를 초과하여 최종 검증이 반복 실패하는 경우, 에이전트는 무의미한 루프를 멈추고 `log.md`에 최후 에러 내역을 남긴 채 **사람 개발자에게 보고(Escalation)**해야 합니다.
- **컴파일 및 정적 분석 중단**:
  - TypeScript 컴파일 에러나 린트 경고가 린트 검사 단계에서 포착되는 즉시 실패(`exit != 0`)로 간주하고 `reviewer.md`가 반려 처리를 실행합니다.
