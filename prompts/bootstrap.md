# Build my development-to-publication workflow

Paste the prompt below into the development chat for the project you want to share. It creates a personalized workflow and a first review package. It adapts to the agent's actual access; it cannot grant account permissions or create missing content.

---

You are working in my project. Build a reusable workflow that shortens the path from development to publication: extract the useful proof from my work, create product-demo videos/images and channel-specific copy, then deliver approved packages through Buffer API. Start with one source project and the destinations I select. Make the next run easy from this development chat.

## Inspect before asking

Read applicable project instructions and relevant existing brand/publication context. Inspect the project's media and tooling; reuse working components. Determine the runtime, OS, file access, connectors/browser, render tools and supported Skill discovery location. Keep publication setup separate from product code unless integration needs a small justified change.

Classify capabilities as verified, available but untested, missing or blocked. A credential or installed tool is not a verified integration. Do not assume access to my other chats, social accounts, entire account history or local machine. If you can read this repository, use its portable Skill and Buffer CLI rather than rewriting the same adapter.

## Ask for the missing inputs in one concise batch

- My target channels, actual accounts, language, audience and purpose
- The source project and content: screencast files/folder, product images, existing post text or exported archive; whether I want a new capture
- Profile URLs and a few representative posts/designs, plus examples I dislike
- Paths to optional music, overlay/transition footage, logo, fonts and templates; any settings I already want preserved
- Where to save local masters, personal profiles, final packages and a shared delivery ledger
- Whether Buffer and a media host are already configured; ask only for credential variable names or locations, never keys in chat

Ask only what is not already known. Local paths must be accessible to the machine running you. If they are not, explain the exact missing access and offer a supported alternative. Music, visual branding and templates are optional. Continue independent inspection while required source inputs are pending.

## Build my personal profile from evidence

Review a bounded sample: start with 15–30 accessible recent posts plus my selected examples and their visuals when available. Use supported connectors/browser or my exports. Report sample size, dates, sources and gaps. Do not call a sample a complete account audit or inspect unrelated private conversations.

Extract rules for voice, language, headline structure, density, credits and channel adaptation. Extract typography, alignment, spacing, palette, framing and motion only where evidence supports them. Mark rules as explicit preferences, observed patterns or provisional proposals, with source examples and confidence. Engagement figures do not establish that a style caused success.

Show a compact proposed profile with concrete copy/layout examples for calibration. My current instructions override inferred patterns. If no visual style exists, propose a restrained starting direction. Do not impose another creator's identity on me.

## Apply the product-demo method

Use Amir Mushich's production principles as starting points, adapting aesthetics to my approved preferences:

- Select a short coherent sequence demonstrating a real product behavior
- Preserve essential UI, the active object and action/cursor context; reframe horizontal footage without blindly cropping or accelerating designed interactions
- Let visible proof carry the explanation; choose copy that describes what the artifact actually does
- Use a concise headline when helpful; put process detail and credits in the caption where appropriate
- As an optional Reel starting layout, use one centered headline block without microcopy or decorative dividers, and no periods at headline line endings; adapt other channels deliberately
- Use my selected branding assets; record opening-transition timing, blend mode and SFX gain if supplied
- Listen to and select an actual music segment from permitted sources; record offset, gain and fades separately from SFX
- For stills, select a legible real product state and preserve interface fidelity
- Credit the actual code agent, media model/provider and original concept author; distinguish concept work from commissioned work and avoid invented impact claims

No personal music, fonts, transition files or private client assets from Amir are included or implied.

## Save the reusable system and render the first package

Keep three layers separate: my personal profile, the demo-production method, and runtime/render/delivery adapters. Create or carefully update a compact personal publication Skill using the current runtime's supported location. Preserve existing Skills and record meaningful rule changes with their reason/example. If installation is unavailable, save the folder in the workspace and explain how to load it.

Keep actual paths/settings in a private asset manifest. Keep credentials and private content outside shared files. Reuse my renderer or choose an available local one such as FFmpeg or a composition engine. Do not require a paid editor, paid generation or a particular template unless I selected it. Run concrete scripts before claiming they work.

Create one source content record and separate versioned packages per destination. Include facts/credits, source paths/hashes, render recipe, final media/cover, caption, exact account/channel, format, timing, approvals and delivery status. Retain local masters. Adapt copy and composition per channel instead of mechanically reposting identical text.

Render one complete review package first. Inspect dimensions, duration, typography, framing, seams, timing and audio. Show the actual preview and caption with the intended account and timing. Do not call an unavailable preview or untested integration finished. After calibration, prepare other requested variants.

## Deliver through Buffer API, then verify

Follow this lifecycle:

```text
Project + sources → select proof → compose channel variants
                   → preview → feedback → revise → approve
                   → Buffer API → draft / queue / schedule / publish
                   → provider status → live link → local receipt
```

Preparation is not publication authorization. Respect existing authorization when it covers the exact package, account and timing; ask only when essential scope is missing or changes. Recording approval is not a substitute for the user's actual decision.

Start with a read-only Buffer connection/channel check. Verify each requested destination's actual account/format requirements through official docs or live capabilities. Use the provided adapter's plan and dry run before an external write. Advanced formats outside its tested contract need a deliberate extension and verification.

Buffer requires stable public media URLs; a local file path is not an upload. Keep masters local and configure a separate delivery copy using my approved host. Prepare a concrete hosting option if none exists. Do not expose a local folder or activate paid hosting silently. Keep the delivery file available until publication completes.

All chats must share a content/channel ledger and lock. Bind approval to the exact package and media hashes. Persist the attempt before creation and the provider ID immediately when returned. Reconcile an uncertain submission before retrying. Distinguish draft, scheduled, processing and published; inspect the actual live link before claiming independent verification. Archive the receipt. If delivery is blocked, preserve the finished package and identify the exact remaining step.

Do not activate recurring monitoring or unattended publication during setup. Do not publish to accounts/channels I did not select.

## Make subsequent requests simple

Support ordinary requests such as:

- Publication: prepare this project for X and LinkedIn
- Publication: adapt this screencast into a Reel or Short
- Publication: make a still image for the selected channel
- Publication: revise the current package with these edits
- Publication: publish the approved packages now
- Publication: schedule the approved LinkedIn version for the agreed time

These are natural-language workflow requests, not universal built-in slash commands. Verify how Skills are discovered/invoked in this runtime. Update reusable personal preferences after feedback; keep asset-specific edits local to the package.

Finish with the first review artifact, saved file locations, next invocation, verified capabilities and specific blockers. Continue useful authorized work until that package is ready.
