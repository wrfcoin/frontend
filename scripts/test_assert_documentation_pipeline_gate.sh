#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
gate="$root/scripts/assert-documentation-pipeline-gate.sh"

run_gate() {
  ANALYZE_RESULT="$1" GENERATE_RESULT="$2" VISUAL_RESULT="$3" DEPLOY_RESULT="$4" \
    SHOULD_REBUILD="$5" EVENT_NAME="$6" DEPLOY_DOCS="$7" "$gate"
}

run_gate success skipped skipped skipped false schedule false
run_gate success success success skipped true schedule false
run_gate success success success success true workflow_dispatch true

if run_gate success success success skipped true workflow_dispatch true; then
  echo "selected deploy incorrectly accepted a skipped deployment" >&2
  exit 1
fi

if run_gate success success success success true schedule false; then
  echo "non-selected deploy incorrectly accepted a deployment that ran" >&2
  exit 1
fi

if run_gate success success skipped skipped false schedule false; then
  echo "no-rebuild incorrectly accepted generate/visual that ran" >&2
  exit 1
fi

if run_gate success skipped skipped skipped "" schedule false; then
  echo "non-boolean should-rebuild incorrectly accepted" >&2
  exit 1
fi

if run_gate failure skipped skipped skipped false schedule false; then
  echo "failed analysis incorrectly accepted" >&2
  exit 1
fi

echo "documentation pipeline terminal-gate controls passed"
