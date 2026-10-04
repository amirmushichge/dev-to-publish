# Contributing

Useful contributions include tested channel metadata recipes, renderer integrations, media-host adapters and cold-start reports from Codex, Claude Code or Hermes.

Describe the exact runtime/account format and distinguish mock tests, live read-only checks and live delivery. Use synthetic fixtures. Keep private media, profiles, delivery receipts and credentials out of commits.

Run:

```bash
node --test
node scripts/check-repo.mjs
```

No live social writes run in CI. Preserve explicit delivery authorization, package-hash review, shared locking and the uncertain-submission receipt. A new renderer should produce an inspectable artifact; a new channel recipe should cite the current official contract and disclose untested behavior.

Keep the bootstrap practical and the Skill compact. Add a supporting reference when it changes a real decision; avoid duplicating provider manuals.
