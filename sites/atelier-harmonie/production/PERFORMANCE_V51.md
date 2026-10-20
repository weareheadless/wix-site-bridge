# Performance startup v51

Source commit: 7dc0a18. Bridge readback verified all 52 updates.

Use the Wix-connected repository scripts/build-startup.mjs and scripts/verify-startup.mjs as the canonical build, following STARTUP.md. The prototype-based build-production.mjs is superseded for startup generation; running it would restore stale V50 content. Do not re-enable manifest entries marked enabled:false. Legal pages use normal Wix sources. The lamp category entry is now a compressed load-once packet in the central registry. Both controller entries use the same canonical HTML. No Editor layout was published.

Private recovery remains on the originating Mac under /private/tmp/atelier-performance-release/receipt/before.json and receipt.json. The public startup-release.json records only embed IDs, hashes and enabled states; no credentials or snapshot HTML. Publish the current saved Editor layout to verify the public release.
