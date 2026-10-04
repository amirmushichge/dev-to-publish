import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { BufferClient, CREATE_QUERY } from '../src/buffer.mjs';
import { assertApproval, assertChannel, digest, fileHash, validate, verifyLocal, verifyRemote } from '../src/package.mjs';
import { publicationState, readJSON, receiptPath, reconcile, refresh, submit } from '../src/delivery.mjs';

const fixture = () => ({ schemaVersion: 1, contentId: 'product-1', version: 'v1', service: 'linkedin', accountLabel: 'Test account', media: [],
  createInput: { channelId: 'channel-1', text: 'Real demonstration', assets: [], mode: 'addToQueue', schedulingType: 'automatic', saveToDraft: false, needsApproval: false } });
const approval = pkg => ({ approvedBy: 'Reviewer', evidence: 'Human review reference', packageHash: digest(pkg) });
const destination = { id: 'channel-1', service: 'linkedin', isLocked: false, isDisconnected: false, isQueuePaused: false };
const sent = { id: 'post-1', channelId: 'channel-1', text: 'Real demonstration', assets: [], status: 'sent', schedulingType: 'automatic', externalLink: 'https://example.com/post-1' };
async function sandbox(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'dev-to-publish-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}
test('dry run requires neither approval nor a client and creates no receipt', async t => {
  const stateDir = await sandbox(t);
  const pkg = fixture();
  const result = await submit({ pkg, stateDir, base: stateDir });
  assert.equal(result.dryRun, true);
  assert.equal(await readJSON(receiptPath(pkg, stateDir)), null);
});
test('unapproved mutation does not reach the client', async t => {
  const dir = await sandbox(t);
  let called = false;
  await assert.rejects(submit({ pkg: fixture(), base: dir, stateDir: dir, commit: true, client: { channel() { called = true; } } }), /Approval/);
  assert.equal(called, false);
});
test('approval binds text, destination, timing, media and provenance', () => {
  const pkg = fixture();
  for (const change of [p => p.createInput.text += '!', p => p.createInput.channelId = 'other',
    p => p.createInput.mode = 'shareNow', p => p.createInput.saveToDraft = true,
    p => p.media.push({ path: 'x', sha256: '0'.repeat(64), url: 'https://example.com/x' }), p => p.facts = ['Changed fact']]) {
    const next = structuredClone(pkg); change(next);
    assert.throws(() => assertApproval(next, approval(pkg)), /stale/);
  }
  assert.doesNotThrow(() => assertApproval(pkg, approval(pkg)));
});
test('hash is insensitive to object key order but sensitive to asset order', () => {
  assert.equal(digest({ a: 1, b: 2 }), digest({ b: 2, a: 1 }));
  assert.notEqual(digest([1, 2]), digest([2, 1]));
});
test('missing/past or ambiguous scheduled times block delivery', async t => {
  const pkg = fixture(); pkg.createInput.mode = 'customScheduled';
  assert.throws(() => validate(pkg), /dueAt/);
  pkg.createInput.dueAt = '2030-01-01T12:00:00';
  assert.throws(() => validate(pkg), /timezone/);
  pkg.createInput.dueAt = '2000-01-01T12:00:00Z';
  const dir = await sandbox(t);
  await assert.rejects(submit({ pkg, base: dir, stateDir: dir, approval: approval(pkg), commit: true }), /past/);
});
test('assets require complete URL/local-file binding', () => {
  const pkg = fixture(); pkg.createInput.assets = [{ video: { url: 'https://example.com/video.mp4' } }];
  assert.throws(() => validate(pkg), /matching local/);
  pkg.media = [{ url: 'https://example.com/video.mp4', path: 'video.mp4', sha256: '0'.repeat(64) }];
  assert.doesNotThrow(() => validate(pkg));
  pkg.createInput.assets[0].image = { url: 'https://example.com/video.mp4' };
  assert.throws(() => validate(pkg), /exactly one/);
});
test('rejects local URLs, wrong thumbnail units, mixed links/media and unhandled threads', () => {
  const pkg = fixture();
  pkg.createInput.assets = [{ video: { url: 'http://localhost/file.mp4' } }];
  assert.throws(() => validate(pkg), /HTTPS/);
  pkg.createInput.assets = [{ video: { url: 'https://example.com/file.mp4', metadata: { thumbnailOffset: 1.5 } } }];
  assert.throws(() => validate(pkg), /milliseconds/);
  pkg.createInput.metadata = { linkedin: { linkAttachment: { url: 'https://example.com' } } };
  assert.throws(() => validate(pkg), /mutually exclusive/);
  pkg.createInput.assets = []; pkg.createInput.metadata = { linkedin: { thread: [] } };
  assert.throws(() => validate(pkg), /Threads/);
});
test('local export changes are detected independently of package approval', async t => {
  const dir = await sandbox(t);
  const file = path.join(dir, 'clip.mp4'); await writeFile(file, 'approved bytes');
  const pkg = fixture(); pkg.media = [{ path: 'clip.mp4', sha256: await fileHash(file), url: 'https://example.com/clip.mp4' }];
  await verifyLocal(pkg, dir);
  await writeFile(file, 'changed bytes');
  await assert.rejects(verifyLocal(pkg, dir), /changed/);
});
test('hosted bytes must match the reviewed local export', async t => {
  const dir = await sandbox(t); const file = path.join(dir, 'clip.mp4'); await writeFile(file, 'approved bytes');
  const pkg = fixture(); pkg.media = [{ path: file, sha256: await fileHash(file), url: 'https://example.com/clip.mp4' }];
  await verifyRemote(pkg, async () => new Response('approved bytes'));
  await assert.rejects(verifyRemote(pkg, async () => new Response('wrong bytes')), /differs/);
  await assert.rejects(verifyRemote(pkg, async () => new Response('denied', { status: 403 })), /retrievable/);
});
test('rejects wrong, locked or disconnected destinations and paused queues', () => {
  const pkg = fixture();
  for (const override of [{ id: 'wrong' }, { service: 'twitter' }, { isLocked: true }, { isDisconnected: true }, { isQueuePaused: true }]) {
    assert.throws(() => assertChannel(pkg, { ...destination, ...override }));
  }
  pkg.createInput.saveToDraft = true;
  assert.doesNotThrow(() => assertChannel(pkg, { ...destination, isQueuePaused: true }));
});
test('destination failure happens before a mutation attempt is recorded', async t => {
  const dir = await sandbox(t); const pkg = fixture(); let creates = 0;
  await assert.rejects(submit({ pkg, base: dir, stateDir: dir, approval: approval(pkg), commit: true,
    client: { channel: async () => ({ ...destination, isDisconnected: true }), create: async () => { creates++; } } }), /disconnected/);
  assert.equal(creates, 0); assert.equal(await readJSON(receiptPath(pkg, dir)), null);
});
test('attempt is durable before network call, then provider ID is saved', async t => {
  const dir = await sandbox(t); const pkg = fixture();
  const client = { channel: async () => destination, create: async () => {
    const record = await readJSON(receiptPath(pkg, dir)); assert.equal(record.state, 'submission-uncertain'); return { ...sent, status: 'sending' };
  } };
  const result = await submit({ pkg, base: dir, stateDir: dir, approval: approval(pkg), commit: true, client });
  assert.equal(result.providerPostId, sent.id); assert.equal(result.state, 'processing');
  const stored = JSON.parse(await readFile(result.receipt, 'utf8')); assert.equal(stored.providerPostId, sent.id);
});
test('uncertain mutation blocks retries, including version changes', async t => {
  const dir = await sandbox(t); const pkg = fixture(); let creates = 0;
  const client = { channel: async () => destination, create: async () => { creates++; throw Error('connection lost after send'); } };
  const options = { base: dir, stateDir: dir, commit: true, client };
  await assert.rejects(submit({ ...options, pkg, approval: approval(pkg) }), /connection lost/);
  assert.equal((await readJSON(receiptPath(pkg, dir))).state, 'submission-uncertain');
  const next = structuredClone(pkg); next.version = 'v2';
  await assert.rejects(submit({ ...options, pkg: next, approval: approval(next) }), /Existing delivery/);
  assert.equal(creates, 1);
});
test('concurrent workers share one lock and cannot create duplicate posts', async t => {
  const dir = await sandbox(t); const pkg = fixture(); let release;
  const barrier = new Promise(resolve => { release = resolve; }); let started;
  const entered = new Promise(resolve => { started = resolve; }); let creates = 0;
  const client = { channel: async () => destination, create: async () => { creates++; started(); await barrier; return sent; } };
  const options = { pkg, base: dir, stateDir: dir, commit: true, approval: approval(pkg), client };
  const first = submit(options); await entered;
  await assert.rejects(submit(options), /locked/);
  release(); await first; assert.equal(creates, 1);
});
test('saved provider IDs are refreshed without creating again', async t => {
  const dir = await sandbox(t); const pkg = fixture(); let creates = 0;
  const client = { channel: async () => destination, create: async () => { creates++; return { ...sent, status: 'scheduled', externalLink: null }; }, post: async () => sent };
  await submit({ pkg, base: dir, stateDir: dir, approval: approval(pkg), commit: true, client });
  const result = await refresh({ pkg, stateDir: dir, client });
  assert.equal(result.state, 'published-provider-reported'); assert.equal(creates, 1);
  await assert.rejects(submit({ pkg, base: dir, stateDir: dir, approval: approval(pkg), commit: true, client }), /Existing delivery/);
});
test('reconciliation adopts matching post and refuses mismatched destination', async t => {
  const dir = await sandbox(t); const pkg = fixture();
  const client = { channel: async () => destination, create: async () => { throw Error('lost response'); }, post: async () => ({ ...sent, channelId: 'wrong' }) };
  await assert.rejects(submit({ pkg, base: dir, stateDir: dir, approval: approval(pkg), commit: true, client }));
  await assert.rejects(reconcile({ pkg, stateDir: dir, client, providerPostId: sent.id }), /does not match/);
  client.post = async () => sent;
  const result = await reconcile({ pkg, stateDir: dir, client, providerPostId: sent.id });
  assert.equal(result.providerPostId, sent.id);
});
test('provider states are distinct and notification is never called published', () => {
  for (const [status, state] of Object.entries({ draft: 'draft', needs_approval: 'needs-approval', scheduled: 'scheduled', sending: 'processing', error: 'failed' })) {
    assert.equal(publicationState({ ...sent, status }), state);
  }
  assert.equal(publicationState({ ...sent, externalLink: null }), 'sent-link-pending');
  assert.equal(publicationState({ ...sent, schedulingType: 'notification' }), 'manual-action-required');
});
test('GraphQL variables preserve multiline copy and query is not interpolated', async () => {
  const input = { ...fixture().createInput, text: 'Line one\nQuotes " and literal $()' };
  const client = new BufferClient('test-key', async (url, options) => {
    assert.equal(url, 'https://api.buffer.com');
    const body = JSON.parse(options.body); assert.equal(body.query, CREATE_QUERY); assert.equal(body.variables.input.text, input.text);
    return Response.json({ data: { createPost: { __typename: 'PostActionSuccess', post: sent } } });
  });
  assert.equal((await client.create(input)).id, sent.id);
});
test('errors never expose key/response body and do not retry', async () => {
  let requests = 0;
  const client = new BufferClient('secret-test-key', async () => { requests++; return Response.json({ errors: [{ message: 'sensitive detail secret-test-key' }] }); });
  await assert.rejects(client.create(fixture().createInput), error => !error.message.includes('secret-test-key') && /GraphQL/.test(error.message));
  assert.equal(requests, 1);
});
