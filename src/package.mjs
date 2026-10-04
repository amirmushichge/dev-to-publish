import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const fail = message => { throw Error(message); };
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
export const canonical = value => JSON.stringify(sort(value));
function sort(value) {
  if (Array.isArray(value)) return value.map(sort);
  if (plain(value)) return Object.fromEntries(Object.keys(value).sort().map(k => [k, sort(value[k])]));
  return value;
}
export const digest = value => createHash('sha256').update(canonical(value)).digest('hex');
export async function fileHash(filename) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}
export function publicURL(value) {
  let u;
  try { u = new URL(value); } catch { fail('Media needs a direct public HTTPS URL'); }
  if (u.protocol !== 'https:' || u.username || u.password || u.hash ||
      /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[)/i.test(u.hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(u.hostname) || u.hostname.endsWith('.local')) {
    fail('Media needs an unauthenticated public HTTPS file URL');
  }
  return value;
}

export function validate(pkg) {
  if (pkg?.schemaVersion !== 1) fail('schemaVersion must be 1');
  for (const key of ['contentId', 'version', 'service', 'accountLabel']) {
    if (!nonempty(pkg[key])) fail(`Missing ${key}`);
  }
  const input = pkg.createInput;
  if (!plain(input)) fail('Missing createInput');
  // Restrict this starter to one text/media post; advanced threads need a deliberate adapter extension.
  const allowed = ['text', 'channelId', 'assets', 'metadata', 'mode', 'schedulingType', 'saveToDraft', 'needsApproval', 'dueAt', 'aiAssisted'];
  for (const key of Object.keys(input)) if (!allowed.includes(key)) fail(`Unsupported createInput field: ${key}`);
  if (!nonempty(input.channelId)) fail('Missing channelId');
  if (!['shareNow', 'addToQueue', 'shareNext', 'customScheduled'].includes(input.mode)) fail('Invalid mode');
  if (input.schedulingType !== 'automatic') fail('This adapter supports automatic publishing only');
  if (input.needsApproval !== false) fail('needsApproval must be false; local review is separate from Buffer team approval');
  if (typeof input.saveToDraft !== 'boolean') fail('Set saveToDraft explicitly');
  if (input.mode === 'customScheduled') {
    if (!nonempty(input.dueAt) || !/(Z|[+-]\d\d:\d\d)$/.test(input.dueAt) || !Number.isFinite(Date.parse(input.dueAt))) fail('customScheduled needs an ISO dueAt with timezone');
  } else if (input.dueAt !== undefined) fail('dueAt is only supported for customScheduled');
  if (!Array.isArray(input.assets)) fail('assets must be an array, including [] for text');
  if (input.text !== undefined && typeof input.text !== 'string') fail('text must be a string');
  if (!nonempty(input.text) && !input.assets.length) fail('Post must contain text or media');
  if (input.metadata !== undefined && !plain(input.metadata)) fail('metadata must be an object');
  if (Object.values(input.metadata || {}).some(m => m?.thread)) fail('Threads need a deliberate adapter extension');
  if (input.assets.length && Object.values(input.metadata || {}).some(m => m?.linkAttachment)) fail('linkAttachment and assets are mutually exclusive');
  const urls = [];
  for (const asset of input.assets) {
    if (!plain(asset) || Object.keys(asset).length !== 1 || !['image', 'video', 'document'].includes(Object.keys(asset)[0])) fail('Each asset needs exactly one image, video or document');
    const kind = Object.keys(asset)[0];
    const media = asset[kind];
    if (!plain(media)) fail('Asset must be an object');
    urls.push(publicURL(media.url));
    if (media.thumbnailUrl) urls.push(publicURL(media.thumbnailUrl));
    if (kind === 'document' && (!media.thumbnailUrl || !nonempty(media.title))) fail('Document needs thumbnailUrl and title');
    const offset = media.metadata?.thumbnailOffset;
    if (offset !== undefined && (!Number.isInteger(offset) || offset < 0)) fail('thumbnailOffset must be a nonnegative integer in milliseconds');
  }
  if (!Array.isArray(pkg.media)) fail('media must list local files + hashes + delivery URLs, or [] for text');
  const actual = pkg.media.map(m => m.url);
  if (new Set(actual).size !== actual.length) fail('List each media URL once');
  if (urls.some(u => !actual.includes(u)) || actual.some(u => !urls.includes(u))) fail('Every attached URL, including thumbnails, needs one matching local media entry');
  for (const media of pkg.media) {
    if (!nonempty(media.path) || !/^[a-f0-9]{64}$/.test(media.sha256)) fail('Media needs local path and SHA-256');
  }
  return pkg;
}
export async function loadPackage(filename) {
  return { pkg: validate(JSON.parse(await readFile(filename, 'utf8'))), base: path.dirname(path.resolve(filename)) };
}
export async function verifyLocal(pkg, base) {
  for (const media of pkg.media) {
    if (await fileHash(path.resolve(base, media.path)) !== media.sha256) fail('Local media changed: render a new version and review it again');
  }
}
export function assertApproval(pkg, approval) {
  if (!approval?.approvedBy || !approval?.evidence || approval.packageHash !== digest(pkg)) fail('Approval missing or stale: review this exact package first');
}
export async function verifyRemote(pkg, fetcher = fetch) {
  // Hash the bytes, not just the URL: deliver the actual reviewed export.
  for (const media of pkg.media) {
    const response = await fetcher(media.url, { signal: AbortSignal.timeout(120000) });
    if (!response.ok || !response.body) fail('Public media is not retrievable');
    publicURL(response.url || media.url);
    const hash = createHash('sha256');
    let bytes = 0;
    for await (const chunk of response.body) {
      bytes += chunk.length;
      if (bytes > 512 * 1024 * 1024) fail('Media exceeds this starter adapter\'s 512 MB download limit');
      hash.update(chunk);
    }
    if (hash.digest('hex') !== media.sha256) fail('Hosted media differs from the reviewed local export');
  }
}
export function assertChannel(pkg, channel) {
  if (!channel || channel.id !== pkg.createInput.channelId || channel.service !== pkg.service) fail('Destination channel/service mismatch');
  if (channel.isLocked || channel.isDisconnected) fail('Channel is locked or disconnected');
  if (channel.isQueuePaused && !pkg.createInput.saveToDraft && ['addToQueue', 'shareNext'].includes(pkg.createInput.mode)) fail('Channel queue is paused');
}
export function assertSamePost(pkg, post) {
  if (post.channelId !== pkg.createInput.channelId || (post.text || '') !== (pkg.createInput.text || '') ||
      canonical(post.assets.map(a => a.source)) !== canonical(pkg.createInput.assets.map(a => Object.values(a)[0].url))) fail('Remote post does not match package text/channel/media; investigate manually');
}
