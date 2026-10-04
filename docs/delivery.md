# Delivery lifecycle

## Local masters and public media

Buffer API does not upload local files. It needs a direct, publicly accessible HTTPS media URL. Keep masters local and configure a separate delivery copy on a host you control. The URL must remain available until publication completes, including queued posts. Login pages, viewer links and rapidly expiring links are unsuitable. See [Buffer's media-hosting guide](https://developers.buffer.com/guides/hosting-media.html).

Choose the host as part of onboarding. This starter does not create cloud accounts, upload private folders or start a public local server. The CLI downloads each attached file before submission and verifies that its bytes match the reviewed local export. This verifies access from the agent's network; Buffer's fetch can still fail because of host restrictions. Prefer immutable/versioned URLs.

## Package and approval

A package contains one content/version/channel variant. `createInput` contains the Buffer request; `media` maps attached file URLs to local files and hashes. Text-only posts use empty arrays. Document thumbnails and custom image/video thumbnails also need local entries. Channel metadata follows [Buffer's reference](https://developers.buffer.com/reference.html), not a generic cross-platform schema.

Approval is tied to a hash of the complete package. Changing the caption, destination, mode, cover, URLs, provenance fields or other package settings requires renewed review. Local media changes also block delivery. The CLI's explicit `--commit` separates planning from an external write, including creating a Buffer draft.

## Submission and states

Every worker must use the same receipt directory. A content/channel key locks delivery across versions. Before calling `createPost`, the adapter writes a `submission-uncertain` receipt. When a provider ID arrives it stores the ID and actual response state. Existing receipts block recreating the post, including intentional attempts to bypass them with a new version.

| Reported state | Meaning |
| --- | --- |
| draft | Saved in Buffer; not scheduled |
| needs-approval | Buffer team approval is still pending |
| scheduled | Queued or scheduled; not yet live |
| processing | Buffer is sending it |
| published-provider-reported | Buffer reports sent and supplies an external link |
| sent-link-pending | Buffer reports sent, but the link is unavailable |
| manual-action-required | Reminder publishing; human action remains |
| failed | Buffer reports an error |
| submission-uncertain | A write may have occurred; no reliable ID was persisted |

The last successful status check is a snapshot. Open the destination's live link before claiming independent publication verification. Archive that observation with the receipt. The CLI does not poll forever or activate a background worker.

## Interrupted requests

Do not automatically retry a create request after a timeout, lost response, GraphQL error or process crash. Inspect Buffer's posts for the exact account, caption, media and attempt time. If the post exists, keep the original package and run:

```bash
node --env-file=.env scripts/buffer.mjs reconcile local/post.json --post-id PROVIDER_ID --confirm-match
```

The adapter also checks channel, text and asset URLs. If Buffer has transformed the source URLs, investigate manually instead of forcing a match. A stale lock can be removed only after establishing that no worker is still running; the receipt must remain.

If rejection or absence is confirmed, archive the original receipt with the investigation evidence. Deliberately clear the active receipt under the user's retry authorization, repair the package and review again. There is no automatic reset command. Local locking is a safeguard, not provider-side exactly-once delivery: copies of a repo or machines with different state directories cannot coordinate.

To intentionally republish previously delivered content, use a distinct content ID only after the user has authorized a new publication. Do not use that mechanism to escape an uncertain state.
