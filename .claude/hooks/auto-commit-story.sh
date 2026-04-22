#!/usr/bin/env bash
# Auto-commit hook: fires after bmad-create-story completes.
# Conditions: a new N-N-*.md story file + sprint-status.yaml both uncommitted.

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$ROOT" || exit 0

NEW_STORY=$(git ls-files --others --exclude-standard -- \
  _bmad-output/implementation-artifacts/ \
  | grep -E '^_bmad-output/implementation-artifacts/[0-9]+-[0-9]+-.+\.md$' \
  | head -1)

SPRINT_CHANGED=$(git diff --name-only HEAD -- \
  _bmad-output/implementation-artifacts/sprint-status.yaml)

if [ -n "$NEW_STORY" ] && [ -n "$SPRINT_CHANGED" ]; then
  STORY_KEY=$(basename "$NEW_STORY" .md)
  git add "$NEW_STORY" _bmad-output/implementation-artifacts/sprint-status.yaml
  git commit -m "Story $STORY_KEY"
fi
