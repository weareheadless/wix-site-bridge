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
CHUNK_CHARS=${CHUNK_CHARS:-3500}
count=0

translate_and_review() {
  local directory=$1 filename=$2 label=$3
  env -i PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/private/tmp}" \
    codex exec -m gpt-6-luna -c model_reasoning_effort=low --ephemeral \
    --ignore-user-config --skip-git-repo-check -C "$directory" -s workspace-write \
    -o "$work/$label-translator-report.txt" \
    "Edit $filename only. Translate every translation field to fluent, idiomatic Mexican Spanish for a luxury Riviera Maya real estate website. Some source passages are already Spanish: preserve those passages in natural Spanish, copying them unchanged when already good. Translate complete ideas, not individual words. Use natural Mexican real estate terms only where the source meaning calls for them. Preserve facts, named places, legal claims, HTML tags and attributes, links, prices, dates and measurements. Keep currency figures in their original numeric form, including the currency symbol (for example, write \$1 millón when the source says \$1 million). Preserve all other JSON fields exactly. Write valid JSON, escaping every newline and quote inside the translation string; use JSON.stringify when saving. Review every visible sentence for English remnants before finishing. Do not access the network or other files. In your final message, say DONE or explain uncertainty." \
    >"$work/$label-translator-log.txt" 2>&1
  node -e 'const fs=require("fs");const item=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const rows=item.rows??[item];if(rows.some(row=>typeof row.translation!=="string"||!row.translation.trim()))throw Error("Incomplete model translation")' "$directory/$filename"
  env -i PATH="$PATH" HOME="$HOME" TMPDIR="${TMPDIR:-/private/tmp}" \
    codex exec -m gpt-6-luna -c model_reasoning_effort=low --ephemeral \
    --ignore-user-config --skip-git-repo-check -C "$directory" -s workspace-write \
    -o "$work/$label-reviewer-report.txt" \
    "Independently review every translation in $filename against its English source. This is customer-facing luxury Mexican real estate copy. Correct literal, awkward, untranslated or misleading Spanish in the translation fields only. Preserve source facts, HTML, URLs, numbers, numeric currency figures and symbols, and all non-translation fields. Keep familiar real estate terms such as penthouse when they fit the source. If you cannot confidently make every field natural and accurate, start your final message with REJECTED and list the reasons. Otherwise start your final message with APPROVED. Do not access the network or other files." \
    >"$work/$label-reviewer-log.txt" 2>&1
  if ! rg -qi '^\*{0,2}APPROVED\b' "$work/$label-reviewer-report.txt"; then
    printf 'Reviewer rejected %s (%s); saved in %s\n' "$(basename "$batch")" "$label" "$work" >&2
    exit 1
  fi
  node -e 'const fs=require("fs");const item=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const rows=item.rows??[item];if(rows.some(row=>typeof row.translation!=="string"||!row.translation.trim()))throw Error("Incomplete reviewed translation")' "$directory/$filename"
}

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

  # Model subprocesses see only isolated text files, never bridge credentials.
  oversized=$(node -e 'const b=require(process.argv[1]);console.log(b.rows.some(r=>r.source.length>Number(process.argv[2]))?"yes":"no")' "$work/batch.json" "$BATCH_CHARS")
  if [[ "$oversized" == yes ]]; then
    node sites/susimacdonald/scripts/translation-chunks.mjs prepare "$work" "$CHUNK_CHARS"
    for chunk in "$work"/chunks/chunk-*.json; do
      label=$(basename "$chunk" .json)
      translate_and_review "$work/chunks" "$(basename "$chunk")" "$label"
    done
    node sites/susimacdonald/scripts/translation-chunks.mjs assemble "$work" "$CHUNK_CHARS"
  else
    translate_and_review "$work" batch.json batch
  fi
  cp "$work/batch.json" "$batch"
  node sites/susimacdonald/scripts/translate-queue.mjs apply --site "$SITE" --batch "$(basename "$batch")"
  node sites/susimacdonald/scripts/translate-queue.mjs apply --site "$SITE" --batch "$(basename "$batch")" --apply
  count=$((count + 1))
  printf 'Completed %s batch(es); private model logs: %s\n' "$count" "$work"
done
