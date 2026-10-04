# Validation status

Release date: 2026-10-04.

| Component | Status |
| --- | --- |
| Original production/review workflow | Used for a real published Molimao demo |
| Original Buffer delivery | Browser UI delivery, verified public Reel |
| Public Buffer adapter | Automated offline tests; live read-only contract checks |
| API create/publish/schedule | Implemented from official schema; not exercised on live social accounts in this release |
| Media-host upload | User-configured; no upload adapter bundled |
| Rendering | Agent selects/reuses local tools; no universal renderer bundled |
| Codex / Claude Code / Hermes bootstrap | Portable prompt and common Skill format; full cold-start runs on all three not yet tested |
| Unattended publishing | Not enabled |

All 19 automated tests passed on the release build. Run `node --test` for adapter behavior and `node scripts/check-repo.mjs` for packaging (npm script aliases are also provided). CI runs those checks without credentials or social writes. Tests cover package/approval integrity, changed files/URLs, destination mismatch, paused queues, concurrency, crash/network ambiguity, receipt preservation and provider state interpretation.

Live read-only verification passed on 2026-10-04: authentication, organization/channel listing, single-channel lookup, retrieval of an existing post and create-input schema checks. No social writes were made. See `scripts/verify-contract.mjs` to repeat the check against your account; optionally set `BUFFER_VERIFY_POST_ID` to an existing post you can read. Successful introspection is schema verification, not evidence of successful publication or every format's account eligibility.

Official references were checked while building this release: [Buffer API](https://developers.buffer.com/reference.html), [video example](https://developers.buffer.com/examples/create-video-post.html), [media hosting](https://developers.buffer.com/guides/hosting-media.html), [Codex Skills](https://learn.chatgpt.com/docs/build-skills), [Claude Code Skills](https://code.claude.com/docs/en/skills) and [Hermes Skills](https://hermes-agent.nousresearch.com/docs/guides/work-with-skills/).

When reporting your own deployment, update this matrix with what actually ran. A connection, a mock test and a public post are different evidence.
