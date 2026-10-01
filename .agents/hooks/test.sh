#!/usr/bin/env bash
# Verify from the repository root; never auto-format source files.
set -euo pipefail
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="$(cd "$HARNESS_DIR/.." && pwd)"
LOG_FILE="$PROJECT_DIR/log.md"
cd "$PROJECT_DIR"

printf '\n## Verification: %s\n' "$(date '+%Y-%m-%d %H:%M:%S %z')" >> "$LOG_FILE"
printf -- '- cwd: %s\n' "$PROJECT_DIR" >> "$LOG_FILE"
if ! command -v yarn >/dev/null 2>&1 || [[ ! -d node_modules ]]; then
    printf -- '- ENV: BLOCKED (Yarn or node_modules unavailable)\n' >> "$LOG_FILE"
    printf 'Install the repository dependencies with Yarn before verification.\n' >&2
    exit 2
fi

run_check() {
    local label="$1"
    shift
    local result=0
    printf '\n[%s] %s\n' "$label" "$*"
    # Stream diagnostics to the caller. Persist only metadata, not raw logs
    # which may contain tokens, user data or environment values.
    "$@" || result=$?
    if [[ "$result" -eq 0 ]]; then
        printf -- '- %s: PASS (exit=0); command: `%s`\n' "$label" "$*" >> "$LOG_FILE"
    else
        printf -- '- %s: FAIL (exit=%s); command: `%s`\n' "$label" "$result" "$*" >> "$LOG_FILE"
        printf '[%s] failed (exit=%s). Remaining checks were not run.\n' "$label" "$result" >&2
        printf -- '- Remaining checks: SKIPPED (previous failure)\n' >> "$LOG_FILE"
        exit "$result"
    fi
}

printf -- '- Coverage gap: common:test is build-only; common unit tests are not executed by this hook.\n' >> "$LOG_FILE"
run_check FORMAT yarn format:check
run_check BUILD_COMMON yarn workspace @yeolo/common build
run_check TYPE_COMMON yarn workspace @yeolo/common lint
run_check LINT_WEB yarn workspace @yeolo/web lint --max-warnings=0
run_check TYPE_WEB yarn workspace @yeolo/web tsc --noEmit
run_check TYPE_APP yarn workspace @yeolo/app lint
run_check TEST_WEB yarn workspace @yeolo/web test --runInBand --passWithNoTests=false
run_check TEST_APP yarn workspace @yeolo/app test --runInBand --passWithNoTests=false
printf -- '- Configured checks: PASS; common unit tests and full product flows remain outside this hook.\n' >> "$LOG_FILE"
printf '\nConfigured checks passed. Review coverage gaps and acceptance criteria before marking DONE.\n'
