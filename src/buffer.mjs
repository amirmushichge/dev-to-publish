export const ENDPOINT = 'https://api.buffer.com';
export const POST_FIELDS = 'id channelId text status schedulingType externalLink dueAt sentAt assets { source }';
export const CREATE_QUERY = `mutation Create($input: CreatePostInput!) {
  createPost(input: $input) {
    __typename
    ... on PostActionSuccess { post { ${POST_FIELDS} } }
    ... on MutationError { message }
  }
}`;

export class BufferClient {
  constructor(key = process.env.BUFFER_API_KEY, fetcher = fetch) {
    if (!key) throw Error('Set BUFFER_API_KEY in your environment or ignored .env file');
    this.key = key;
    this.fetcher = fetcher;
  }
  async query(query, variables = {}) {
    // No automatic retries: a timed-out mutation may already have succeeded.
    const response = await this.fetcher(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw Error(`Buffer HTTP ${response.status}; inspect destination before retrying a write`);
    const body = await response.json();
    if (body.errors?.length) throw Error('Buffer GraphQL error; inspect destination before retrying a write');
    if (!body.data) throw Error('Buffer response missing data');
    return body.data;
  }
  async organizations() {
    return (await this.query('query { account { organizations { id name } } }')).account.organizations;
  }
  async channels(organizationId) {
    return (await this.query(`query Channels($input: ChannelsInput!) {
      channels(input: $input) { id name service descriptor timezone isLocked isDisconnected isQueuePaused }
    }`, { input: { organizationId } })).channels;
  }
  async channel(id) {
    return (await this.query(`query Channel($input: ChannelInput!) {
      channel(input: $input) { id name service descriptor timezone isLocked isDisconnected isQueuePaused }
    }`, { input: { id } })).channel;
  }
  async create(input) {
    const result = (await this.query(CREATE_QUERY, { input })).createPost;
    if (result?.__typename !== 'PostActionSuccess' || !result.post?.id) {
      // Treat even explicit rejection conservatively. Receipt blocks resubmission.
      throw Error(`Buffer rejected or did not acknowledge creation (${result?.__typename || 'unknown'})`);
    }
    return result.post;
  }
  async post(id) {
    return (await this.query(`query Post($input: PostInput!) {
      post(input: $input) { ${POST_FIELDS} }
    }`, { input: { id } })).post;
  }
}
