#!/usr/bin/env node
import path from 'node:path';
import { BufferClient } from '../src/buffer.mjs';
import { assertApproval, digest, fileHash, loadPackage, verifyLocal } from '../src/package.mjs';
import { atomicJSON, readJSON, reconcile, refresh, submit } from '../src/delivery.mjs';

const [command, filename, ...args] = process.argv.slice(2);
const flag = name => args.includes(name);
const option = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
const output = value => console.log(JSON.stringify(value, null, 2));
try {
  if (command === 'hash') { output({ sha256: await fileHash(filename) }); }
  else if (command === 'doctor') {
    const client = new BufferClient();
    const organizations = await client.organizations();
    const channels = [];
    for (const org of organizations) channels.push(...(await client.channels(org.id)).map(c => ({ ...c, organizationId: org.id })));
    output({ mode: 'read-only', authenticated: true, organizations, channels });
  } else if (['plan', 'approve', 'submit', 'status', 'reconcile'].includes(command)) {
    if (!filename) throw Error('Supply a package JSON path');
    const { pkg, base } = await loadPackage(filename);
    const stateDir = path.resolve(option('--state-dir') || '.publication');
    const approvalFile = path.join(stateDir, `approval-${digest(pkg)}.json`);
    if (command === 'plan') {
      await verifyLocal(pkg, base);
      output({ packageHash: digest(pkg), accountLabel: pkg.accountLabel, service: pkg.service,
        localMediaVerified: true, input: pkg.createInput, media: pkg.media });
    } else if (command === 'approve') {
      if (!flag('--confirm-reviewed') || !option('--by') || !option('--evidence')) throw Error('Approval needs --confirm-reviewed --by NAME --evidence USER_APPROVAL_REFERENCE');
      await verifyLocal(pkg, base);
      const approval = { packageHash: digest(pkg), approvedBy: option('--by'), evidence: option('--evidence'), approvedAt: new Date().toISOString() };
      await atomicJSON(approvalFile, approval);
      output({ approvalFile, ...approval });
    } else if (command === 'submit') {
      const commit = flag('--commit');
      const approval = await readJSON(approvalFile);
      if (commit) assertApproval(pkg, approval);
      output(await submit({ pkg, base, stateDir, approval, commit, client: commit ? new BufferClient() : null }));
    } else if (command === 'status') {
      output(await refresh({ pkg, stateDir, client: new BufferClient() }));
    } else {
      if (!option('--post-id') || !flag('--confirm-match')) throw Error('Inspect Buffer first, then --post-id ID --confirm-match');
      output(await reconcile({ pkg, stateDir, client: new BufferClient(), providerPostId: option('--post-id') }));
    }
  } else {
    console.log(`Dev to Publish — Buffer adapter (Node 22+)\n\nRead-only: doctor | hash FILE | plan PACKAGE | status PACKAGE\nPrepare: approve PACKAGE --confirm-reviewed --by NAME --evidence REFERENCE\nDry run: submit PACKAGE\nExternal write: submit PACKAGE --commit\nRecover: reconcile PACKAGE --post-id ID --confirm-match\n\nAll package commands accept --state-dir PATH. Use one shared directory across chats.`);
  }
} catch (error) {
  // Never print API credentials, raw response bodies, or Authorization headers.
  const key = process.env.BUFFER_API_KEY;
  console.error(key ? error.message.replaceAll(key, '[redacted]') : error.message);
  process.exitCode = 1;
}
