#!/usr/bin/env bash
set -euo pipefail
export PATH="/usr/local/bin:/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS:/Applications/ChatGPT.app/Contents/Resources/codex-cli/codex-path:${PATH:-/usr/bin:/bin}"
MODE=${1:-}
if [[ "$MODE" != '--apply' && "$MODE" != '--benchmark' && "$MODE" != '--rework' ]]; then
  echo 'Dry-run is the default. Pass --benchmark for one unpublished batch, --apply for regular publishing, or --rework for held translations.'
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

if [[ "$MODE" == --rework ]]; then
  MAX_BATCHES=${MAX_BATCHES:-2}
else
  MAX_BATCHES=${MAX_BATCHES:-10} # zero explicitly means continue until the queue is empty
fi
if [[ "$MODE" == --benchmark ]]; then MAX_BATCHES=1; fi
BATCH_CHARS=${BATCH_CHARS:-16000}
CHUNK_CHARS=${CHUNK_CHARS:-10000}
BATCH_FIELDS=${BATCH_FIELDS:-24}
NEXT_COMMAND=next
if [[ "$MODE" == --rework ]]; then NEXT_COMMAND=next-quarantine; fi
count=0

translate_and_review() {
  local directory=$1 filename=$2 label=$3
  node sites/susimacdonald/scripts/compact-batch-html.mjs prepare "$directory/$filename"
  node sites/susimacdonald/scripts/translate-json-batch.mjs "$directory/$filename" "$work/$label-translator-log.txt"
  node sites/susimacdonald/scripts/review-visible-translation.mjs "$directory/$filename" "$work/$label-review.json" "$work/$label-reviewer-log.txt"
  node sites/susimacdonald/scripts/compact-batch-html.mjs restore "$directory/$filename"
  node sites/susimacdonald/scripts/restore-translation-tags.mjs "$directory/$filename"
}

while [[ "$MAX_BATCHES" == 0 || "$count" -lt "$MAX_BATCHES" ]]; do
  next=$(node sites/susimacdonald/scripts/translate-queue.mjs "$NEXT_COMMAND" --site "$SITE" --limit "$BATCH_FIELDS" --max-chars "$BATCH_CHARS")
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
    node - "$work" <<'NODE'
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
const reviews = fs.readdirSync(dir).filter(name => /^chunk-\d+-review\.json$/.test(name))
  .map(name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
const rejected = reviews.some(item => item.rejectedIndices.length);
fs.writeFileSync(path.join(dir, 'batch-review.json'), JSON.stringify({
  rejectedIndices: rejected ? [0] : [],
  reason: reviews.filter(item => item.rejectedIndices.length).map(item => item.reason).join('; ')
}, null, 2));
NODE
  else
    translate_and_review "$work" batch.json batch
  fi
  cp "$work/batch.json" "$batch"
  node sites/susimacdonald/scripts/translate-queue.mjs apply --site "$SITE" --batch "$(basename "$batch")"
  if [[ "$MODE" == --benchmark ]]; then
    printf 'Benchmark reviewed without publishing: %s; logs: %s\n' "$(basename "$batch")" "$work"
    break
  fi
  split=$(node sites/susimacdonald/scripts/split-reviewed-batch.mjs "$batch" "$work/batch-review.json")
  approved_batch=$(printf '%s' "$split" | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).batch ?? ""')
  printf '%s\n' "$split"
  if [[ -n "$approved_batch" ]]; then
    node sites/susimacdonald/scripts/translate-queue.mjs apply --site "$SITE" --batch "$(basename "$approved_batch")"
    node sites/susimacdonald/scripts/translate-queue.mjs apply --site "$SITE" --batch "$(basename "$approved_batch")" --apply
  fi
  count=$((count + 1))
  printf 'Completed %s batch(es); private model logs: %s\n' "$count" "$work"
done
