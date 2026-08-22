#!/usr/bin/env bash
# NitipCuy base-freshness gate.
# Verifies that the current branch is up to date with a base ref (default origin/main).
# Used by parallel sessions to detect that another session has merged to main and a rebase is needed.
#
# Usage:
#   ./scripts/check-base-freshness.sh [base-ref] [commit|merge]
#
# Modes:
#   commit  (default) — STALE prints a WARN and exits 0. Run this before committing.
#   merge            — STALE prints a BLOCK and exits 1. Run this before requesting merge.
#
# This gate is deliberately kept outside `pnpm check`, matching scripts/check-lifecycle-docs.sh,
# so a stale base cannot be hidden inside a generic command. See
# docs/development/parallel-coordination.md and docs/development/quality-gates.md.

set -euo pipefail

base_ref="${1:-origin/main}"
mode="${2:-commit}"

if ! git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
  echo "base-freshness: missing base ref $base_ref (run: git fetch origin)" >&2
  exit 1
fi

mb="$(git merge-base "$base_ref" HEAD)"
bs="$(git rev-parse "$base_ref")"

if [[ "$mb" == "$bs" ]]; then
  echo "base-freshness: PASS (HEAD is up to date with $base_ref at $bs)"
  exit 0
fi

echo "base-freshness: STALE -- merge-base $mb != $base_ref $bs" >&2
echo "base-freshness: another session advanced $base_ref; rebase required." >&2

if [[ "$mode" == "merge" ]]; then
  echo "base-freshness: BLOCK (merge-request mode). Run: git fetch origin && git rebase $base_ref" >&2
  exit 1
fi

echo "base-freshness: WARN (commit mode). Rebase before requesting merge or editing canonical blocks." >&2
exit 0