#!/usr/bin/env bash
set -euo pipefail
export PATH="/usr/local/bin:/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS:/Applications/ChatGPT.app/Contents/Resources/codex-cli/codex-path:${PATH:-/usr/bin:/bin}"
if [[ "${1:-}" != '--apply' ]]; then
  echo 'Dry-run is the default. Pass --apply to translate and publish reviewed batches.'
  exit 0
fi

cd "$(dirname "$0")/../../.."
SITE=susimacdonald
SITE_ID=878460ca-c98c-402b-8a10-862023f67cce
STATE=sites/susimacdonald/.wix-bridge-state/translation-queue
set -a
source sites/susimacdonald/.wix-bridge-state/app.env
set +a
export WIX_ALLOWED_SITE_IDS="$SITE_ID"

MAX_BATCHES=${MAX_BATCHES:-0} # zero means continue until the queue is empty
BATCH_CHARS=${BATCH_CHARS:-6000}
count=0

while [[ "$MAX_BATCHES" == 0 || "$count" -lt "$MAX_BATCHES" ]]; do
  next=$(node sites/susimacdonald/scripts/translate-queue.mjs next --site "$SITE" --limit 12 --max-chars "$BATCH_CHARS")
  batch=$(printf '%s' "$next" | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).batch ?? ""')
  if [[ -z "$batch" ]]; then
    printf '%s\n' "$next"
    break
  fi
  work=$(mktemp -d "${TMPDIR:-/private/tmp}/susi-translation.XXXXXX")
  chmod 700 "$work"
  cp "$batch" "$work/batch.json"
  chmod 600 "$work/batch.json"
  printf 'Batch %s: translating %s\n' "$((count + 1))" "$(basename "$batch")"

  # Keep bridge credentials out of both model subprocesses. They only see the
  # isolated text batch; the parent shell alone performs Wix API calls.
  env -i PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/private/tmp}" \
    codex exec -m gpt-6-luna -c model_reasoning_effort=low --ephemeral \
    --ignore-user-config --skip-git-repo-check -C "$work" -s workspace-write \
    -o "$work/translator-report.txt" \
    'Edit batch.json only. Translate every translation field to fluent, idiomatic Mexican Spanish for a luxury Riviera Maya real estate website. Translate complete ideas, not individual words. Use natural Mexican real estate terms such as departamento, preventa, plusvalía, amenidades, escrituración and rendimiento only where the source meaning calls for them. Preserve facts, named places, legal claims, HTML tags and attributes, links, prices, dates and measurements. Preserve all other JSON fields exactly. Existing Spanish draft is context, not a mandatory answer. Review every visible sentence for English remnants before finishing. Do not access the network or other files. In your final message, say DONE or explain uncertainty.' \
    >"$work/translator-log.txt" 2>&1

  env -i PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/private/tmp}" \
    codex exec -m gpt-6-luna -c model_reasoning_effort=low --ephemeral \
    --ignore-user-config --skip-git-repo-check -C "$work" -s workspace-write \
    -o "$work/reviewer-report.txt" \
    'Independently review every translation in batch.json against its English source. This is customer-facing luxury Mexican real estate copy. Correct literal, awkward, untranslated or misleading Spanish in the translation fields only. Preserve source facts, HTML, URLs, numbers and all non-translation fields. If you cannot confidently make every field natural and accurate, start your final message with REJECTED and list the row IDs and reasons. Otherwise start your final message with APPROVED. Do not access the network or other files.' \
    >"$work/reviewer-log.txt" 2>&1
  if ! rg -qi '^\*{0,2}APPROVED\b' "$work/reviewer-report.txt"; then
    printf 'Reviewer rejected %s; saved in %s\n' "$(basename "$batch")" "$work" >&2
    exit 1
  fi
  cp "$work/batch.json" "$batch"
  node sites/susimacdonald/scripts/translate-queue.mjs apply --site "$SITE" --batch "$(basename "$batch")"
  node sites/susimacdonald/scripts/translate-queue.mjs apply --site "$SITE" --batch "$(basename "$batch")" --apply
  count=$((count + 1))
  printf 'Completed %s batch(es); private model logs: %s\n' "$count" "$work"
done
