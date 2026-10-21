#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "FAIL-CLOSED: $*" >&2
  exit 1
}

require_result() {
  local job="$1" expected="$2" actual="$3"
  [ "$actual" = "$expected" ] || fail "$job result=$actual, expected $expected"
}

require_result analyze-components success "${ANALYZE_RESULT:-}"

case "${SHOULD_REBUILD:-}" in
  true)
    require_result generate-documentation success "${GENERATE_RESULT:-}"
    require_result visual-testing success "${VISUAL_RESULT:-}"
    if [ "${EVENT_NAME:-}" = workflow_dispatch ] && [ "${DEPLOY_DOCS:-}" = true ]; then
      require_result deploy-documentation success "${DEPLOY_RESULT:-}"
    else
      require_result deploy-documentation skipped "${DEPLOY_RESULT:-}"
    fi
    ;;
  false)
    require_result generate-documentation skipped "${GENERATE_RESULT:-}"
    require_result visual-testing skipped "${VISUAL_RESULT:-}"
    require_result deploy-documentation skipped "${DEPLOY_RESULT:-}"
    ;;
  *)
    fail "analyze-components did not produce a boolean should-rebuild output: ${SHOULD_REBUILD:-<empty>}"
    ;;
esac

echo "documentation pipeline terminal gate passed"
