#!/usr/bin/env bash
set -euo pipefail

# programmatically verify git ignores playwright/.auth/session.json
if ! git check-ignore -q playwright/.auth/session.json; then
  echo "🚨 [Git Boundary Failure]: 'playwright/.auth/' is NOT ignored in .gitignore!"
  exit 1
fi

# check if any files inside playwright/.auth/ are tracked or staged
TRACKED_AUTH_FILES=$(git ls-files "playwright/.auth/")
if [ -n "$TRACKED_AUTH_FILES" ]; then
  echo "🚨 [Git Boundary Failure]: The following authentication credentials are tracked by git:"
  echo "$TRACKED_AUTH_FILES"
  exit 2
fi

echo "✅ [Git Boundary Verification]: Playwright authentication path is safely ignored and free of secrets."
exit 0
