#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function resolveCli(): string {
  const __filename = fileURLToPath(import.meta.url);
  const root = path.resolve(path.dirname(__filename), '../../..');
  return path.join(root, 'packages/aid-doctor/dist/cli.js');
}

function run(args: string[], env?: NodeJS.ProcessEnv) {
  return spawnSync('node', [resolveCli(), ...args], {
    stdio: 'pipe',
    env: { ...process.env, ...(env || {}) },
    encoding: 'utf8',
  });
}

// Basic JSON smoke – uses a domain likely to resolve via DNS
const jsonRes = run(['json', 'simple.agentcommunity.org', '--timeout', '8000', '--no-fallback']);
if (jsonRes.error) {
  console.error('spawn error', jsonRes.error);
  process.exit(1);
}
if (jsonRes.status !== 0) {
  console.error('aid-doctor json exited with code', jsonRes.status);
  console.error(jsonRes.stdout);
  console.error(jsonRes.stderr);
  process.exit(jsonRes.status || 1);
}

try {
  const parsed = JSON.parse(jsonRes.stdout) as {
    domain: string;
    record?: unknown;
    exitCode: number;
  };
  if (!parsed || parsed.domain !== 'simple.agentcommunity.org') throw new Error('bad json output');
} catch (e) {
  console.error('invalid JSON output', e);
  console.error(jsonRes.stdout);
  process.exit(1);
}

// Loopback PKA path – relies on pka_e2e.ts server
const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '../../..');
const pkaScript = path.join(root, 'packages/e2e-tests/src/pka_e2e.ts');
const node = process.execPath;
const p = spawnSync(node, [pkaScript], {
  stdio: 'inherit',
  env: { ...process.env },
});
if (p.status !== 0) {
  console.error('pka_e2e failed with code', p.status);
  process.exit(p.status || 1);
}

console.log('✅ aid-doctor e2e passed');
