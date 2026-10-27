# OPS-008 Wix regression verification

Run: `luna-ops008-20261027t0700z`  
Issue: [wix-site-bridge #11](https://github.com/weareheadless/wix-site-bridge/issues/11)  
Baseline: `96433f4761af8d63a9db18f2409f3777f0ef4db3`  
Contract pin from the claim: `weareheadless/crawlseo@13115a14f9811c2d9f30e453615d911fe199a59d`

## Result

This was **not an end-to-end production verification**. No CrawlSEO blog draft or revision was created, no approval hash/stale-approval response was observed, and no Wix target was mutated. This checkout at the pinned baseline has no lockfile (`npm ci` exits with EUSAGE), no customer manifest/low-impact target configuration, and this run did not establish the required production app/site identity. No credentials were read or exposed. The issue's production-only requirement cannot be represented by fixture evidence.

## Executed evidence

- `npm ci` — blocked: repository has no `package-lock.json` or npm shrinkwrap. No dependency installation was performed.
- `npm test` — passed, 35 tests, 0 failures (Node built-in test runner; fixture/unit evidence only).
- Bridge help (`node src/cli.mjs inspect --help`) states all operations require explicit `--manifest`, `--site`, and matching allowlisted site ID; custom embed calls additionally require the installed Wix app identity.
- Relevant fixture tests passed: `CrawlSEO consumer calls map to existing MCP tools or explicit unsupported outcomes`; `capability fixture distinguishes read, local preparation, live embed apply and manual editor work`; `plan/apply keeps HTML private and persists intent before a single verified mutation`; `stale revision, wrong hash, and scope drift fail before mutation`; `concurrent apply performs one mutation and duplicate caller is blocked`; `lost response after mutation is reconciled by readback without a retry`; and `missing receipt and removed manifest declaration fail closed with explicit reconciliation state`.

These tests exercise fake/unit clients, not an actual CrawlSEO workspace or Wix site. They do not prove real receipt persistence/readback timing, live replay behavior, a noncritical snippet's rendered effect, or a blog approval/rejection. Host-only command refusal was not independently invoked; the fixture records the capability boundary, not a real host invocation.

## Remaining verification

An authorized operator must run the complete issue flow with the connected production CrawlSEO flow and a confirmed **noncritical Wix subpage/snippet**: create the blog draft and capture its revision/hash; improve that draft and capture the changed hash and stale-approval rejection; then inspect capability, plan the exact snippet update, and apply using that exact plan ID and reviewed hash. Confirm the private receipt exists before the observed Wix write, then read back the desired hash and replay without a second write. Confirm unsupported and host-only operations are refused. Visually confirm the changed snippet on that same noncritical page and restore its prior content. Never use the homepage or a customer-critical embed. No live mutation or paid-work budget was incurred by this run.
