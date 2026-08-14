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

if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

bun install --frozen-lockfile
bun scripts/extract.js
bun scripts/build.js
