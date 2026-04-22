#!/usr/bin/env bash
# Auto-commit hook: fires after bmad-dev-story completes.
# Conditions: a story file was modified (tasks/status updated) AND there are source code changes.

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$ROOT" || exit 0

MODIFIED_STORY=$(git diff --name-only HEAD -- \
  _bmad-output/implementation-artifacts/ \
  | grep -E '^_bmad-output/implementation-artifacts/[0-9]+-[0-9]+-.+\.md$' \
  | head -1)

[ -z "$MODIFIED_STORY" ] && exit 0

# Require source code changes outside _bmad-output/ to avoid false positives
CODE_CHANGES=$(git status --porcelain | grep -v '^\?\?' | grep -v '_bmad-output/' | head -1)
UNTRACKED_CODE=$(git ls-files --others --exclude-standard | grep -v '_bmad-output/' | head -1)

if [ -n "$CODE_CHANGES" ] || [ -n "$UNTRACKED_CODE" ]; then
  STORY_KEY=$(basename "$MODIFIED_STORY" .md)
  git add -A
  git commit -m "Story $STORY_KEY"
fi
