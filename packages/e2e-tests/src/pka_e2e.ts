#!/usr/bin/env node

import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

function loadVectors() {
  const __filename = fileURLToPath(import.meta.url);
  const root = path.resolve(path.dirname(__filename), '../../..');
  const raw = fs.readFileSync(path.join(root, 'protocol', 'pka_vectors.json'), 'utf8');
  return JSON.parse(raw).vectors as Array<Record<string, unknown>>;
}

function seedToPkcs8Ed25519(seed: Buffer): Buffer {
  const header = Buffer.from([0x30,0x2e,0x02,0x01,0x00,0x30,0x05,0x06,0x03,0x2b,0x65,0x70,0x04,0x22,0x04,0x20]);
  return Buffer.concat([header, seed]);
}

function b58encode(bytes: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const size = Math.ceil(bytes.length * Math.log(256) / Math.log(58)) + 1;
  const b = new Uint8Array(size);
  let length = 0;
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    let j = size - 1;
    while (carry !== 0 || j >= size - length) {
      carry += 256 * b[j];
      b[j] = carry % 58;
      carry = Math.floor(carry / 58);
      j--;
    }
    length = size - 1 - j;
  }
  let it = size - length;
  while (it < size && b[it] === 0) it++;
  let out = '1'.repeat(zeros);
  for (let i = it; i < size; i++) out += ALPHABET[b[i]];
  return out;
}

function publicFromPrivate(priv: crypto.KeyObject): Buffer {
  const spki = crypto.createPublicKey(priv).export({ type: 'spki', format: 'der' }) as Buffer;
  return spki.subarray(spki.length - 32);
}

async function main() {
  const vector = loadVectors().find((v) => v.id === 'valid-ed25519');
  if (!vector) throw new Error('Missing vector');

  const seed = Buffer.from(vector.key.seed_b64, 'base64');
  const pkcs8 = seedToPkcs8Ed25519(seed);
  const priv = crypto.createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
  const rawPub = publicFromPrivate(priv);
  const pka = 'z' + b58encode(new Uint8Array(rawPub));

  const port = 19081;
  const domain = `localhost:${port}`;
  const record = { v: 'aid1', u: `http://${domain}/mcp`, p: 'mcp', k: pka, i: 'g1' };

  const server = http.createServer((req, res) => {
    if (!req.url) return res.writeHead(404).end();
    if (req.url === '/.well-known/agent') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(record));
      return;
    }
    if (req.url === '/mcp') {
      const challenge = req.headers['aid-challenge'] as string;
      const date = req.headers['date'] as string;
      const order = ['AID-Challenge', '@method', '@target-uri', 'host', 'date'];
      const lines: string[] = [];
      for (const item of order) {
        switch (item) {
          case 'AID-Challenge': lines.push(`"AID-Challenge": ${challenge}`); break;
          case '@method': lines.push(`"@method": GET`); break;
          case '@target-uri': lines.push(`"@target-uri": http://${domain}/mcp`); break;
          case 'host': lines.push(`"host": ${domain}`); break;
          case 'date': lines.push(`"date": ${date}`); break;
        }
      }
      const created = Math.floor(Date.now()/1000);
      const paramsStr = `(${order.map((c) => `"${c}"`).join(' ')});created=${created};keyid=g1;alg="ed25519"`;
      lines.push(`"@signature-params": ${paramsStr}`);
      const base = Buffer.from(lines.join('\n'));
      const sig = crypto.sign(null, base, priv);
      res.writeHead(200, {
        'Signature-Input': `sig=("${order.join('" "')}");created=${created};keyid=g1;alg="ed25519"`,
        'Signature': `sig=:${Buffer.from(sig).toString('base64')}:`,
        'Date': date,
      });
      res.end('');
      return;
    }
    res.writeHead(404).end();
  });

  await new Promise<void>((resolve) => server.listen(port, resolve));
  console.log(`Mock server listening on ${domain}`);

  const __filename = fileURLToPath(import.meta.url);
  const cliPath = path.resolve(path.dirname(__filename), '../../aid-doctor/dist/cli.js');

  const result = spawnSync(
    'node',
    [cliPath, 'check', domain, '--timeout', '3000', '--show-details', '--fallback-timeout', '2000'],
    { stdio: 'inherit', env: { ...process.env, AID_ALLOW_INSECURE_WELL_KNOWN: '1' } },
  );
  server.close();
  if (result.status !== 0) process.exit(result.status || 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

