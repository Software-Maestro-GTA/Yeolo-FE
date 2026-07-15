---
name: msw-api-mocking
description: Guideline for writing MSW mocks and RTL tests inside Yeolo-FE.
---

# MSW API Mocking Rule

테스트 코드를 작성하는 Tester 에이전트(`tester.md`)와 개발을 진행하는 Coder 에이전트(`coder.md`)가 외부 백엔드 API 연동을 포함하는 컴포넌트를 테스트할 때 준수해야 하는 규칙입니다.

## 1. MSW (Mock Service Worker) 핸들러 작성 규격

- 모든 Mocking API 핸들러는 `Yeolo-SPEC/api-specs/API-*.md`에 정의된 규격을 엄격히 준수해야 합니다.
- **REST API 모킹 예제**:

  ```typescript
  import { http, HttpResponse } from "msw";

  export const handlers = [
    http.get("*/api/travel/history", ({ request }) => {
      // API-FB-3 규격에 맞는 Mock 데이터 반환
      return HttpResponse.json(
        {
          success: true,
          data: [
            { id: 1, destination: "Jeju", startDate: "2026-07-20" },
            { id: 2, destination: "Seoul", startDate: "2026-08-15" },
          ],
        },
        { status: 200 },
      );
    }),

    // 에러 케이스도 반드시 핸들러에 포함
    http.post("*/api/travel/create", () => {
      return HttpResponse.json(
        {
          success: false,
          message: "Invalid request parameter",
        },
        { status: 400 },
      );
    }),
  ];
  ```

## 2. Jest & React Testing Library (RTL) 통합 규칙

1.  **서버 라이프사이클 관리**:
    - 테스트 스위트 시작 시 `server.listen()`, 종료 시 `server.close()`, 각 테스트 종료 후 `server.resetHandlers()`를 호출하여 테스트 간 데이터 오염을 방지합니다.
2.  **비동기 렌더링 대기**:
    - MSW를 통해 모킹된 API 결과가 화면에 반영될 때까지 `screen.getByText` 대신 `await screen.findByText`를 사용합니다.
3.  **에러 핸들러 동적 오버라이드**:
    - 특정 테스트 케이스에서 실패 시나리오를 검증할 때는 `server.use(...)`를 사용하여 핸들러를 실패 상태로 오버라이드합니다.
    - 예시:
      ```typescript
      server.use(
        http.get("*/api/travel/history", () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );
      ```
