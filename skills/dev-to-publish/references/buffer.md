# Buffer delivery

Use the provided CLI from a checkout of this repository, or an equivalent verified adapter. Discover its path in the user's environment; do not embed the author's local paths.

- Read [API setup](../../../docs/setup.md) and [delivery lifecycle](../../../docs/delivery.md) when those files are present in a full checkout. For a standalone Skill installation, refer to the [public setup guide](https://github.com/amirmushichge/dev-to-publish/blob/main/docs/setup.md) and [delivery guide](https://github.com/amirmushichge/dev-to-publish/blob/main/docs/delivery.md).
- Use `BUFFER_API_KEY` through the environment or an ignored `.env`. Never expose it in a post, log, Skill or shared package.
- Start with the read-only `doctor` command. Look up the actual channel ID/service/account and permissions before composing delivery input.
- Buffer requires stable, publicly retrievable media URLs. Keep local masters and hashes; prepare a separate delivery copy using the user's configured host. Do not expose their media directory or silently activate a hosting service.
- `plan` checks local media. `submit` without `--commit` is offline and makes no write. Record human approval only after review/authorization of that exact package.
- Every worker must use the same `--state-dir`. The CLI creates a content/channel lock and persists an uncertain receipt before calling `createPost`. Do not change the content ID to bypass a receipt.
- A create timeout can mean the post exists. Inspect Buffer and use `reconcile` with its ID when the post matches. A confirmed rejection/absence needs deliberate ledger recovery; automatic retries are disabled.
- Save and query the provider ID. `sent` plus an external link is provider-reported publication; inspect that URL before saying the live artifact was verified.

Official sources: [API reference](https://developers.buffer.com/reference.html), [getting started](https://developers.buffer.com/guides/getting-started.html), [media hosting](https://developers.buffer.com/guides/hosting-media.html).
