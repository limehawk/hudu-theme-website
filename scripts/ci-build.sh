#!/usr/bin/env bash
# Cloudflare Pages build: clone the data repos, then extract + build.
# Both source repos are public — no tokens needed.
set -euo pipefail

DEPS="$(mktemp -d)"
git clone --depth 1 https://github.com/limehawk/hudu-themes "$DEPS/hudu-themes"
git clone --depth 1 --filter=blob:none --sparse https://github.com/limehawk/omarchy-theme-website "$DEPS/omarchy-theme-website"
git -C "$DEPS/omarchy-theme-website" sparse-checkout set src/data

export HUDU_THEMES_DIR="$DEPS/hudu-themes"
export OMARCHY_DATA="$DEPS/omarchy-theme-website/src/data/themes-data.json"

npm install --no-audit --no-fund
node scripts/extract.js
node scripts/build.js
