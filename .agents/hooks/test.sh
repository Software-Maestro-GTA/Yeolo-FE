#!/bin/bash

# 하네스 검증 및 테스트 스크립트 (test.sh)
# Coder의 구현 완료 자체 검증 및 Reviewer의 통합 무결성 빌드 검사를 자동으로 수행합니다.

set -o pipefail

# 스크립트가 위치한 hooks 디렉토리를 기준으로 하네스 코어 루트 탐색
WORKSPACE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$WORKSPACE_DIR/../log.md"

echo "🧪 하네스 무결성 검증을 시작합니다..."
echo "=============================================="
echo -e "\n## 검증 세션 시작 시각: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"

# 0. node_modules 체크 경고
if [ ! -d "$WORKSPACE_DIR/../node_modules" ]; then
    echo "⚠️ 경고: node_modules 디렉토리를 찾을 수 없습니다. yarn install을 먼저 진행해 주세요."
fi

# 1. 공통 모듈 빌드 (dependency build)
echo "🔍 0. 공통 모듈 빌드 (@yeolo/common) 구동 중..."
BUILD_TMP=$(mktemp)
if yarn workspace @yeolo/common build > "$BUILD_TMP" 2>&1; then
    echo "✅ [BUILD] PASS - 공통 모듈 빌드 성공"
    echo "- **BUILD**: PASS" >> "$LOG_FILE"
else
    echo -e "\n### ❌ [BUILD] FAIL - @yeolo/common 빌드 오류 발생\n\`\`\`text" >> "$LOG_FILE"
    cat "$BUILD_TMP" >> "$LOG_FILE"
    echo -e "\`\`\`" >> "$LOG_FILE"
    rm -f "$BUILD_TMP"
    echo "❌ [BUILD] FAIL - @yeolo/common 빌드가 실패했습니다. log.md를 참조하세요."
    exit 1
fi
rm -f "$BUILD_TMP"

# 2. Linter 검사 (정적 분석)
echo "🔍 1. 정적 분석 검사 (Linter) 구동 중..."
LINT_TMP=$(mktemp)
if yarn lint > "$LINT_TMP" 2>&1; then
    echo "✅ [LINT] PASS - 코드 스타일에 위반 사항이 없습니다."
    echo "- **LINT**: PASS" >> "$LOG_FILE"
else
    echo -e "\n### ❌ [LINT] FAIL - 린트 위반 사항 발생\n\`\`\`text" >> "$LOG_FILE"
    cat "$LINT_TMP" >> "$LOG_FILE"
    echo -e "\`\`\`" >> "$LOG_FILE"
    rm -f "$LINT_TMP"
    echo "❌ [LINT] FAIL - 린트 위반 사항이 발견되었습니다. log.md를 참조하세요."
    exit 1
fi
rm -f "$LINT_TMP"

# 3. TypeScript 컴파일러 검사 (웹 프로젝트 타입 무결성 추가 검증)
echo "🔍 2. 웹 패키지 타입 검사 (TypeScript Compiler) 구동 중..."
TYPE_TMP=$(mktemp)
if yarn workspace @yeolo/web tsc --noEmit > "$TYPE_TMP" 2>&1; then

    echo "✅ [TYPE] PASS - 타입 오류가 존재하지 않습니다."
    echo "- **TYPE**: PASS" >> "$LOG_FILE"
else
    echo -e "\n### ❌ [TYPE] FAIL - TypeScript 컴파일 타입 오류 발생\n\`\`\`text" >> "$LOG_FILE"
    cat "$TYPE_TMP" >> "$LOG_FILE"
    echo -e "\`\`\`" >> "$LOG_FILE"
    rm -f "$TYPE_TMP"
    echo "❌ [TYPE] FAIL - TypeScript 컴파일 타입 오류가 발생했습니다. log.md를 참조하세요."
    exit 1
fi
rm -f "$TYPE_TMP"

# 4. 테스트 스크립트 검사 (테스트 무결성)
echo "🔍 3. 단위 및 통합 테스트 구동 중..."
TEST_TMP=$(mktemp)
if yarn test > "$TEST_TMP" 2>&1; then
    echo "✅ [TEST] PASS - 모든 유닛/통합 테스트 케이스가 통과했습니다."
    echo "- **TEST**: PASS" >> "$LOG_FILE"
else
    echo -e "\n### ❌ [TEST] FAIL - 단위 및 통합 테스트 실패\n\`\`\`text" >> "$LOG_FILE"
    cat "$TEST_TMP" >> "$LOG_FILE"
    echo -e "\`\`\`" >> "$LOG_FILE"
    rm -f "$TEST_TMP"
    echo "❌ [TEST] FAIL - 일부 테스트 케이스가 실패했습니다. log.md를 참조하세요."
    exit 1
fi
rm -f "$TEST_TMP"

echo "=============================================="
echo -e "\n### 🎉 통합 검증 PASS - $(date '+%Y-%m-%d %H:%M:%S')\n- 모든 검증(BUILD/LINT/TYPE/TEST)을 완벽히 통과했습니다! 통합이 승인되었습니다." >> "$LOG_FILE"
exit 0
