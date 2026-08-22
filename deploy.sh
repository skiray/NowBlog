#!/usr/bin/env bash
# Build the site and publish dist/ to the `pages` branch (for Gitee Pages).
# After running, push with: git push origin pages
set -euo pipefail

cd "$(dirname "$0")"
REPO="$(pwd)"

DISTCOPY="$(mktemp -d)"
WT="$(mktemp -d)/pages"

cleanup() {
  [ -n "${WT:-}" ] && git -C "$REPO" worktree remove "$WT" --force 2>/dev/null || true
  [ -n "${DISTCOPY:-}" ] && rm -rf "$DISTCOPY" || true
}
trap cleanup EXIT

echo "==> building..."
npm run build

echo "==> copying dist..."
cp -r dist/. "$DISTCOPY"

echo "==> updating pages branch..."
git worktree add --force -b pages "$WT" 2>/dev/null || git worktree add --force "$WT" pages
cd "$WT"
git rm -rf . >/dev/null 2>&1
git clean -fdx >/dev/null 2>&1
cp -r "$DISTCOPY/." "$WT/"
git add -A
if git diff --cached --quiet; then
  echo "no changes to deploy"
else
  git commit -q -m "deploy: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "==> pages branch updated"
fi
cd "$REPO"

echo "==> done. Push with: git push origin pages"
