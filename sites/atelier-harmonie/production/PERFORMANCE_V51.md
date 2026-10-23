# Performance startup atelier-performance-20261020-v53-geometry

Source commit: 3869d354c83fa3a99b7043d7e8ff5714cb55643e. Bridge readback verified all 53 updates.

Use the Wix-connected repository scripts/build-startup.mjs and scripts/verify-startup.mjs as the canonical build, following STARTUP.md. The prototype-based build-production.mjs is superseded for startup generation; running it would restore stale V50 content. Do not re-enable manifest entries marked enabled:false. Legal pages use normal Wix sources. The lamp category entry is now a compressed load-once packet in the central registry. Both controller entries use the same canonical HTML. No Editor layout was published.

Private recovery snapshots remain in the originating Mac bridge customer .wix-bridge-state directory, under the corresponding release folder (before.json and receipt.json). The public startup-release.json records only embed IDs, hashes and enabled states; no credentials or snapshot HTML. Publish the current saved Editor layout to verify the public release.
