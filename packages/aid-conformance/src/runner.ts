import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parse } from '@agentcommunity/aid';
import type { GoldenFixture, GoldenRecordCase } from './index.js';
import { fixtures as defaultFixtures } from './index.js';

function loadFixtureFromPath(filePath: string): GoldenFixture {
  const abs = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  const data = fs.readFileSync(abs, 'utf8');
  const json = JSON.parse(data) as GoldenFixture;
  if (!json || !Array.isArray(json.records)) {
    throw new Error('Invalid fixture: missing records[]');
  }
  return json;
}

function runFixture(fix: GoldenFixture) {
  let passed = 0;
  let failed = 0;

  for (const c of fix.records as GoldenRecordCase[]) {
    try {
      const parsed = parse(c.raw);
      const ok = JSON.stringify(parsed) === JSON.stringify(c.expected);
      if (ok) {
        passed += 1;
      } else {
        failed += 1;
        console.error(`✗ ${c.name}: mismatch`);
        console.error('  expected:', c.expected);
        console.error('  got     :', parsed);
      }
    } catch (err) {
      failed += 1;
      console.error(`✗ ${c.name}: threw`, err);
    }
  }

  console.log(`AID Conformance: ${passed} passed, ${failed} failed, total ${passed + failed}`);
  process.exitCode = failed === 0 ? 0 : 1;
}

function main() {
  const arg = process.argv[2];
  if (!arg) {
    runFixture(defaultFixtures);
    return;
  }
  const fix = loadFixtureFromPath(arg);
  runFixture(fix);
}

main();
