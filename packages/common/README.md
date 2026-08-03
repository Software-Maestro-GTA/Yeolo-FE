# @yeolo/common

여로 서비스의 공통 비즈니스 로직과 웹, 앱에서 공유하는 공통 자원을 관리하는 핵심 패키지입니다.  
TypeScript 기반으로 작성되어 있으며, 공통 API 통신 클라이언트, 데이터 타입, 커스텀 훅 및 상태 관리 스토어를 제공합니다.

---

## 폴더 구조

```text
packages/common/
├── src/
│   ├── api/          # API 통신 클라이언트 및 엔드포인트 정의
│   ├── constants/    # 공통 상수 정의
│   ├── hooks/        # 공통 커스텀 훅
│   ├── store/        # 전역 상태 관리 스토어
│   ├── types/        # TypeScript 공통 인터페이스 및 타입 정의
│   ├── utils/        # 공통 유틸리티 함수
│   └── index.ts      # 모듈 통합 진입점
├── package.json
└── tsconfig.json
```
