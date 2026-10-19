# Susi Mexican Spanish translation queue

The queue uses the installed Susi bridge app and Wix Translation Content API. It never calls Wix machine translation, so it does not spend translation credits. Luna translates one private JSON batch at a time. The runner checks the installed site identity, live English source, current Spanish field, HTML tags, URLs, prices and measurements before writing. It then reads the published fields back from Wix.

For continuous processing, run `bash sites/susimacdonald/scripts/run-translation-queue.sh --apply` from the bridge repository. The script invokes `gpt-6-luna` with low reasoning for translation and a separate review, then runs the bridge dry-run and applied publish for each approved batch. It stops on the first failed review, validation, API write, or read-back check; run it again to resume from the remaining live fields. `MAX_BATCHES=1` limits it to a single checkpoint, and `BATCH_CHARS=6000` controls the normal text budget. The model subprocesses work in isolated temporary folders without bridge credentials. Only the parent runner contacts Wix.

An individual Wix rich-text field can exceed the normal text budget. The runner splits such a field at paragraph boundaries, translates and reviews each chunk, then verifies that the exact source was preserved and the merged translation passes the same guards before publishing the single Wix field.

The user authorized an hourly Codex heartbeat called **Continue Susi Spanish translations** on 19 October 2026. It runs up to 20 reviewed batches per wake-up and stays quiet during normal progress. Avoid starting a second copy of the runner while that heartbeat is active.

From the bridge repository, load `sites/susimacdonald/.wix-bridge-state/app.env` in the shell and set `WIX_ALLOWED_SITE_IDS=878460ca-c98c-402b-8a10-862023f67cce`. Never print or commit the environment file.

1. `node sites/susimacdonald/scripts/translate-queue.mjs status --site susimacdonald` reports the remaining fields.
2. `node sites/susimacdonald/scripts/translate-queue.mjs next --site susimacdonald --limit 12 --max-chars 6000` creates a private batch under `.wix-bridge-state/translation-queue/`. It starts with the homepage and city landing pages, skips known Wix placeholder text and image URIs, and then continues through other page and listing content. The character cap keeps long rich-text translations small enough for careful review.
3. Give that batch to Luna 6 low. Fill only each row's `translation`, preserving all other JSON fields. Read the rendered text before publishing; a mechanical word substitution can pass structural checks while producing poor Spanish. Review any uncertain proper names, claims and legal copy.
4. `node sites/susimacdonald/scripts/translate-queue.mjs apply --site susimacdonald --batch batch-<id>.json` validates the completed batch and previews its scope. Add `--apply` to save and publish it. Each applied batch has a private receipt with the previous Spanish text and Wix's responses.
5. Repeat from step 1. A rerun after a successful batch excludes the newly published fields. If a batch was interrupted after draft creation, the script accepts its own matching unpublished draft on retry.

The queue covers Wix Translation Content records. The already updated component packets render Spanish embed UI. Wix-owned text and images require translation records; the queue handles their text fields. A reported zero remaining fields means no untranslated text fields remain in the bridge inventory, not that the visual page review is complete.
