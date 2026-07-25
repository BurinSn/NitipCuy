#!/usr/bin/env bash

set -euo pipefail

base_ref="${1:-origin/main}"

required_files=(
  "handoff.md"
  "docs/changes.md"
  "docs/roadmap.md"
  "docs/learning.md"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Lifecycle check failed: required file is missing: $file" >&2
    exit 1
  fi
done

if ! git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
  echo "Lifecycle check failed: base ref does not exist: $base_ref" >&2
  exit 1
fi

merge_base="$(git merge-base "$base_ref" HEAD)"
changed_files="$(git diff --name-only "$merge_base" --)"
missing_updates=()

for file in "${required_files[@]}"; do
  if ! grep -Fqx "$file" <<<"$changed_files"; then
    missing_updates+=("$file")
  fi
done

if (( ${#missing_updates[@]} > 0 )); then
  echo "Lifecycle check failed: every material change must update all four lifecycle documents." >&2
  printf 'Missing update: %s\n' "${missing_updates[@]}" >&2
  exit 1
fi

echo "Lifecycle check passed: all four lifecycle documents are present and updated."
echo "Content accuracy still requires live-state reconciliation and hostile review."
