#!/usr/bin/env bash
# Cloudflare Pages builds & deploys automatically from the connected Git repo
# (master branch) — no manual upload needed.
# This script just builds locally to verify, then pushes master.
set -euo pipefail

cd "$(dirname "$0")"

echo "==> building (local verification)..."
npm run build

echo "==> pushing master (Cloudflare will build & deploy)..."
git push origin master

echo "==> done. Check the Cloudflare Pages dashboard for the build status."
