import { mkdir, open, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertApproval, assertChannel, assertSamePost, digest, validate, verifyLocal, verifyRemote } from './package.mjs';

export async function atomicJSON(filename, value) {
  await mkdir(path.dirname(filename), { recursive: true });
  const temporary = `${filename}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  await rename(temporary, filename);
}
export async function readJSON(filename) {
  try { return JSON.parse(await readFile(filename, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
export function receiptPath(pkg, stateDir) {
  // Same content/destination share a ledger across versions: changing version cannot bypass an uncertain write.
  return path.join(stateDir, `${digest([pkg.contentId, pkg.createInput.channelId])}.json`);
}
async function locked(filename, action) {
  await mkdir(path.dirname(filename), { recursive: true });
  let handle;
  try { handle = await open(`${filename}.lock`, 'wx', 0o600); }
  catch (error) { if (error.code === 'EEXIST') throw Error('Delivery locked: another worker or interrupted run owns this content/channel'); throw error; }
  try { await handle.writeFile(String(process.pid)); return await action(); }
  finally { await handle.close(); await rm(`${filename}.lock`); }
}
export function publicationState(post) {
  if (post.schedulingType === 'notification') return 'manual-action-required';
  if (post.status === 'sent') return post.externalLink ? 'published-provider-reported' : 'sent-link-pending';
  return ({ draft: 'draft', needs_approval: 'needs-approval', scheduled: 'scheduled', sending: 'processing', error: 'failed' })[post.status] || 'unknown';
}
export async function submit({ pkg, base, approval, stateDir, client, commit = false, remoteCheck = verifyRemote }) {
  validate(pkg);
  if (!commit) return { dryRun: true, packageHash: digest(pkg), input: pkg.createInput };
  assertApproval(pkg, approval);
  await verifyLocal(pkg, base);
  if (pkg.createInput.mode === 'customScheduled' && Date.parse(pkg.createInput.dueAt) <= Date.now()) throw Error('Scheduled time is in the past; choose a new time and review again');
  const filename = receiptPath(pkg, stateDir);
  return locked(filename, async () => {
    const previous = await readJSON(filename);
    if (previous) throw Error(`Existing delivery ${previous.state}; inspect receipt/status, do not recreate this post`);
    const channel = await client.channel(pkg.createInput.channelId);
    assertChannel(pkg, channel);
    await remoteCheck(pkg);
    const record = { contentId: pkg.contentId, version: pkg.version, packageHash: digest(pkg), destination: channel,
      input: pkg.createInput, approval, attemptedAt: new Date().toISOString(), state: 'submission-uncertain' };
    // Persist BEFORE the mutation. A crash/network error must not cause automatic duplication.
    await atomicJSON(filename, record);
    const post = await client.create(pkg.createInput);
    record.providerPostId = post.id;
    record.post = post;
    record.state = publicationState(post);
    await atomicJSON(filename, record);
    return { receipt: filename, ...record };
  });
}
export async function refresh({ pkg, stateDir, client }) {
  const filename = receiptPath(pkg, stateDir);
  return locked(filename, async () => {
    const record = await readJSON(filename);
    if (!record?.providerPostId) throw Error('No provider ID. Reconcile the uncertain request in Buffer before proceeding');
    const post = await client.post(record.providerPostId);
    record.post = post;
    record.state = publicationState(post);
    record.checkedAt = new Date().toISOString();
    await atomicJSON(filename, record);
    return { receipt: filename, ...record };
  });
}
export async function reconcile({ pkg, stateDir, client, providerPostId }) {
  const filename = receiptPath(pkg, stateDir);
  return locked(filename, async () => {
    const record = await readJSON(filename);
    if (!record || record.state !== 'submission-uncertain') throw Error('Only an uncertain receipt can be reconciled');
    if (record.packageHash !== digest(pkg)) throw Error('Use the original submitted package for reconciliation');
    const post = await client.post(providerPostId);
    assertSamePost(pkg, post);
    record.providerPostId = post.id;
    record.post = post;
    record.state = publicationState(post);
    record.reconciledAt = new Date().toISOString();
    await atomicJSON(filename, record);
    return { receipt: filename, ...record };
  });
}
