#!/usr/bin/env bash
# Create missing harness records without deleting previous work.
set -euo pipefail
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="$(cd "$HARNESS_DIR/.." && pwd)"
TEMPLATE_PATH="$HARNESS_DIR/templates/progress_template.md"

if [[ ! -f "$TEMPLATE_PATH" ]]; then
    printf 'Missing progress template: %s\n' "$TEMPLATE_PATH" >&2
    exit 1
fi

# noclobber also prevents concurrent initializers from replacing a record.
if [[ ! -e "$PROJECT_DIR/progress.md" ]]; then
    (set -o noclobber; cat "$TEMPLATE_PATH" > "$PROJECT_DIR/progress.md")
fi
if [[ ! -e "$PROJECT_DIR/log.md" ]]; then
    (set -o noclobber; printf '# Harness Execution Log\n' > "$PROJECT_DIR/log.md")
fi
printf 'Harness records ready; existing contents preserved.\n'
