#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."
SITE=susimacdonald
SITE_ID=878460ca-c98c-402b-8a10-862023f67cce
STATE=sites/susimacdonald/.wix-bridge-state
KEY_FILE=${OPENROUTER_ENV_FILE:-/home/admin/.config/susi-translation/openrouter.env}
if [[ "${1:-}" != --apply && "${1:-}" != --preview && "${1:-}" != --audit ]]; then
  echo 'Use --preview for the next page, --audit for packet coverage, or --apply for one reviewed page.'
  exit 0
fi
if [[ "${1:-}" == --apply && ! -s "$KEY_FILE" ]]; then
  echo "OpenRouter key file missing at $KEY_FILE; no page processed." >&2
  exit 2
fi
set -a
source "$STATE/app.env"
if [[ -s "$KEY_FILE" ]]; then source "$KEY_FILE"; fi
set +a
export WIX_ALLOWED_SITE_IDS="$SITE_ID"
if [[ "${1:-}" == --apply && -z "${CHROMIUM_PATH:-}" ]]; then
  CHROMIUM_PATH=$(find "$HOME/.cache/ms-playwright" -path '*/chrome-linux64/chrome' -type f -perm -u+x 2>/dev/null | sort -r | head -1 || true)
  export CHROMIUM_PATH
fi
if [[ "${1:-}" == --apply && ! -x "${CHROMIUM_PATH:-}" ]]; then
  echo 'A Chromium executable is required for rendered page review.' >&2
  exit 2
fi
mkdir -p "$STATE/page-translations"
if [[ "${1:-}" == --preview || "${1:-}" == --audit ]]; then
  exec node sites/susimacdonald/scripts/page-translation-worker.mjs --site "$SITE" "$1"
fi
exec 9>"$STATE/page-translations/worker.lock"
flock -n 9 || { echo 'A page review is already running.'; exit 0; }
node sites/susimacdonald/scripts/page-translation-worker.mjs --site "$SITE" "$1"
