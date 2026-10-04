# Dev to Publish

**Shorten the distance between building something and publishing it.**

An agent workflow that turns work from your development chat into product demos, images and channel-specific copy, then delivers reviewed packages through **Buffer API**.

Bring your project. Keep your own voice and visual style. Let the agent handle the repetitive steps between the artifact and the post.

```text
Your development chat
  ├── working product + project facts
  ├── screencasts / images / existing posts
  └── your voice + optional brand assets + music
                  │
                  ▼
       Personal publication Skill
                  │
       Select → frame → edit → write
                  │
            Channel variants
       ┌──────────┼──────────┐
       X       LinkedIn    Reels / Shorts / other channels
       └──────────┼──────────┘
                  ▼
         Preview → feedback → approval
                  │
         Buffer API → publish / queue / schedule
                  │
         Status → live link → local receipt
```

## Start in your agent chat

1. Open the development chat for the project you want to share
2. Paste the **[bootstrap prompt](prompts/bootstrap.md)** into Codex, Claude Code or Hermes
3. Give the agent your target channels, content sources and optional music/brand folders when it asks
4. Review the first package before it publishes

The prompt asks the agent to inspect its actual access, learn from a bounded sample of your content, create a personal Skill, reuse available rendering tools and connect Buffer. It does not assume access to your entire account or other chats.

For a shorter starting point after cloning this repo:

> Read prompts/bootstrap.md and follow it for this project. Start by checking the available tools and asking for the missing inputs. Prepare one reviewable package before any publication.

## What is included

| Artifact | Purpose |
| --- | --- |
| [Bootstrap prompt](prompts/bootstrap.md) | Onboard an agent from your development chat |
| [Portable Skill](skills/dev-to-publish/SKILL.md) | Reuse the publication workflow in later chats |
| [Demo method](skills/dev-to-publish/references/demo-method.md) | Select and compose faithful product demonstrations |
| [Channel adaptation](skills/dev-to-publish/references/channels.md) | Adapt the same project to different audiences and formats |
| [Profile and asset templates](examples) | Record your preferences and actual content locations |
| [Buffer CLI](scripts/buffer.mjs) | Inspect channels, plan, submit and track a reviewed package |
| [Setup guide](docs/setup.md) | Install the Skill and connect your account |
| [Delivery guide](docs/delivery.md) | Media URLs, approval, receipts and interrupted submissions |

The agent supplies editorial judgment and rendering using tools in your environment. This repo supplies the reusable instructions and a dependency-free API delivery adapter. It does not include a universal video editor, a scraper, a hosting service or a background publisher.

## Try the adapter locally

Requires **Node.js 22+**. No npm dependencies or installation step.

```bash
git clone https://github.com/amirmushichge/dev-to-publish.git
cd dev-to-publish
node scripts/buffer.mjs plan examples/text-post.json
node scripts/buffer.mjs submit examples/text-post.json
```

Both commands are offline. The example is synthetic; `submit` defaults to a dry run.

For your own account, create a Buffer API key, copy `.env.example` to `.env` and enter the key locally. Then:

```bash
node --env-file=.env scripts/buffer.mjs doctor
```

This reads organizations and connected channels. It makes no changes. Copy a real channel ID into a private package under `local/`. See [setup](docs/setup.md) for the complete first run.

## Multiple channels, one source

Prepare separate packages for each destination. Choose the format, copy, media framing and timing per channel. The Buffer adapter accepts its documented image, video and document asset shapes plus channel metadata; it also supports text-only posts.

Actual availability depends on your connected channels, account permissions, Buffer plan and the destination's current requirements. The starter delivers one post per package using automatic publishing. Threads, reminder publishing and special formats need an adapter extension and their own verification. A listed Buffer service is not a promise that every format works on every account.

## Evidence and current status

This project grew from Amir Mushich's workflow for turning a working clothing-store demo into a reviewed Reel and publishing it from the agent through Buffer. **[See the published demo](https://www.instagram.com/reel/DeEPWhTiiY3/)**. That first delivery used Buffer's browser interface; it is evidence for the production/review workflow, not a claim that this API adapter created that post.

The adapter has automated tests for approval binding, destination checks, media integrity, concurrent delivery and uncertain submissions. Live read-only API checks are recorded in [validation](docs/validation.md). Creating new posts through this public adapter has not been exercised against live social accounts in this release. Codex, Claude Code and Hermes installation conventions are documented; full cold-start runs on all three are still untested.

No private client media, personal transition files, music, credentials or account archives are bundled.

## Credits and license

Workflow and product-demo principles by **[Amir Mushich](https://x.com/AmirMushich)**. The Molimao demo referenced above credits the original interaction concept to **[@cambreedesigns](https://x.com/cambreedesigns)** / **[@bernie_studios](https://www.instagram.com/bernie_studios/)** and uses clothing by **[Molimao Sarajevo](https://molimao.ba/)**.

MIT license for this repository's code and documentation. Referenced third-party products and media retain their own rights. This is an independent project, not an official Buffer or agent-provider integration.
