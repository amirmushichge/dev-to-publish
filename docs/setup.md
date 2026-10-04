# Setup

## Agent-first onboarding

Paste [the bootstrap prompt](../prompts/bootstrap.md) into your source project's development chat. The agent should check available access and ask for missing inputs, not send you through every optional setup step. You can use an existing screencast; no new filming or paid generation is required.

Have these ready when relevant: target channels/accounts, profile URLs or exported examples, the source project/media, optional music/brand/template folders and a local archive directory. Paths must be accessible to the machine running the agent.

The agent learns a personal profile from your selected content and feedback. Keep it in `local/` or another private location. The public Skill carries the process, not your identity, credentials or assets.

## Skill installation

The bootstrap can create/install your personal Skill after inspecting the current runtime. To install the provided base Skill manually, copy the **entire** `skills/dev-to-publish` folder into the location supported by your agent:

| Agent | Common personal location | Official documentation |
| --- | --- | --- |
| Codex | `~/.agents/skills/dev-to-publish/` | [Skills](https://learn.chatgpt.com/docs/build-skills) |
| Claude Code | `~/.claude/skills/dev-to-publish/` | [Skills](https://code.claude.com/docs/en/skills) |
| Hermes | `~/.hermes/skills/dev-to-publish/` | [Skills](https://hermes-agent.nousresearch.com/docs/guides/work-with-skills/) |

Verify discovery in your installed version. Existing configurations can use different roots. Do not overwrite an unrelated Skill. You can also keep this repository in the workspace and ask the agent to read its `SKILL.md`; automatic discovery is not required to try the workflow. The supporting references travel with the Skill; the Buffer CLI remains in this checkout.

## Buffer connection

1. Connect your intended channels in your own Buffer account and check plan/permission limits
2. Follow [Buffer's getting-started guide](https://developers.buffer.com/guides/getting-started.html) to create an API key
3. Copy `.env.example` to `.env`, then enter the value locally; alternatively set `BUFFER_API_KEY` using your normal secret manager
4. Run `node --env-file=.env scripts/buffer.mjs doctor`

The CLI talks to `https://api.buffer.com` using GraphQL and a bearer key. Its doctor command reports the actual connected channels without writing posts. A saved key alone does not prove posting permission.

## First package

Copy `examples/text-post.json` or `examples/video-post.json` into `local/`. Replace the synthetic project facts, account label, service, channel ID and media. Have the agent prepare the media and caption for your selected destination. Do not use the example caption on your account.

For media, preserve the rendered local file, run `node scripts/buffer.mjs hash local/exports/demo.mp4`, and record that SHA-256 with its path and a direct public URL. Relative media paths resolve from the package's directory. Use versioned immutable hosting URLs for the reviewed export. See [delivery](delivery.md) before configuring media hosting.

```bash
node scripts/buffer.mjs plan local/post.json
node scripts/buffer.mjs submit local/post.json
```

Show the rendered artifact, copy, actual account, format and proposed timing to the user. Once they authorize this exact package, record their approval reference:

```bash
node scripts/buffer.mjs approve local/post.json --confirm-reviewed --by "Your name" --evidence "Approval message or review reference"
```

This command records an approval; it cannot determine whether the human actually gave it. An agent must never run it to fabricate permission.

Only after that authorization, deliver:

```bash
node --env-file=.env scripts/buffer.mjs submit local/post.json --commit
node --env-file=.env scripts/buffer.mjs status local/post.json
```

The examples default to **Buffer drafts**. For publication, set `saveToDraft: false` and choose `shareNow`, `addToQueue`, `shareNext` or `customScheduled` with an ISO `dueAt` including timezone. Changing these settings invalidates the previous approval. Review the revised package before delivery.

Use `--state-dir` with a shared absolute directory if several project chats can publish. Do not run separate ledgers for the same content/channel. Setup does not activate scheduled agent jobs or unattended publishing.
