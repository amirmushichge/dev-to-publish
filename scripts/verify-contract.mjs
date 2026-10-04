// Read-only contract diagnostics. Outputs types/counts, never keys or account identities.
import { BufferClient, POST_FIELDS } from '../src/buffer.mjs';
const client = new BufferClient();
const organizations = await client.organizations();
let channelCount = 0;
for (const org of organizations) {
  const channels = await client.channels(org.id);
  channelCount += channels.length;
  if (channels[0]) await client.channel(channels[0].id);
}
const data = await client.query(`query Contract {
  createInput: __type(name: "CreatePostInput") { inputFields { name } }
  postInput: __type(name: "PostInput") { inputFields { name } }
  channelInput: __type(name: "ChannelInput") { inputFields { name } }
  post: __type(name: "Post") { fields { name } }
  modes: __type(name: "ShareMode") { enumValues { name } }
}`);
const expected = { createInput: ['channelId', 'assets', 'text', 'mode', 'schedulingType', 'saveToDraft', 'needsApproval', 'metadata', 'dueAt'],
  postInput: ['id'], channelInput: ['id'], post: ['id', 'channelId', 'text', 'assets', 'status', 'externalLink', 'dueAt', 'sentAt', 'schedulingType'],
  modes: ['shareNow', 'addToQueue', 'shareNext', 'customScheduled'] };
for (const [key, fields] of Object.entries(expected)) {
  const actual = (data[key]?.inputFields || data[key]?.fields || data[key]?.enumValues || []).map(f => f.name);
  for (const field of fields) if (!actual.includes(field)) throw Error(`Live schema missing ${key}.${field}`);
}
let existingPostQuery = 'not-requested';
if (process.env.BUFFER_VERIFY_POST_ID) {
  const post = await client.post(process.env.BUFFER_VERIFY_POST_ID);
  if (!post?.id || !Array.isArray(post.assets)) throw Error('Existing-post query contract failed');
  existingPostQuery = 'passed';
}
// Validate post-selection syntax against a non-existing ID; expect a missing-post execution error,
// not an unknown-field/type validation error. Query only; never create a test post.
const response = await fetch('https://api.buffer.com', {
  method: 'POST', headers: { Authorization: `Bearer ${process.env.BUFFER_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: `query { post(input: {id: "000000000000000000000000"}) { ${POST_FIELDS} } }` }),
  signal: AbortSignal.timeout(30000),
});
const body = await response.json();
if (!response.ok || body.errors?.some(e => e.extensions?.code === 'GRAPHQL_VALIDATION_FAILED' || /Cannot query field|Unknown type|Unknown argument|is not defined/.test(e.message))) throw Error('Post query contract failed');
console.log(JSON.stringify({ mode: 'read-only', authenticated: true, organizationCount: organizations.length, channelCount,
  channelQuery: 'passed', inputContract: 'passed', postSelection: 'passed', existingPostQuery, socialWrites: 0 }, null, 2));
