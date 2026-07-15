#!/bin/bash

# 실행 경로 기준 설정
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$DIR/../.."

cd "$ROOT_DIR" || exit 1

if [ -z "$1" ]; then
    echo "Usage: bash run_test.sh [web|app|common]"
    exit 1
fi

AREA="$1"

echo ">> [검증 시작] 대상 영역: $AREA"

# 2. 영역별 검증 명령어 실행 (Yarn Workspaces 활용)
case "$AREA" in
    "web"|"frontend")
        echo ">> Running yarn workspace @yeolo/web lint..."
        yarn workspace @yeolo/web lint
        LINT_CODE=$?
        if [ $LINT_CODE -ne 0 ]; then
            echo "Error: Lint check failed for @yeolo/web."
            exit $LINT_CODE
        fi

        # test 스크립트가 패키지에 정의되어 있는지 확인 후 실행
        if grep -q '"test":' "packages/web/package.json"; then
            echo ">> Running yarn workspace @yeolo/web test..."
            yarn workspace @yeolo/web test
            exit $?
        else
            echo ">> No 'test' script defined in @yeolo/web. Skipping test run."
            exit 0
        fi
        ;;
    "app"|"mobile"|"android"|"ios")
        # test 스크립트가 패키지에 정의되어 있는지 확인 후 실행
        if grep -q '"test":' "packages/app/package.json"; then
            echo ">> Running yarn workspace @yeolo/app test..."
            yarn workspace @yeolo/app test
            exit $?
        else
            echo ">> No 'test' script found in @yeolo/app. Running TypeScript compiler check..."
            yarn workspace @yeolo/app tsc --noEmit
            exit $?
        fi
        ;;
    "common")
        echo ">> Running yarn workspace @yeolo/common build..."
        yarn workspace @yeolo/common build
        exit $?
        ;;
    *)
        echo "Warning: 알 수 없는 영역 '$AREA'. 기본 검증을 성공으로 간주하고 건너뜁니다."
        exit 0
        ;;
esac
