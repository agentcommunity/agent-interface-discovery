import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import type { GoldenFixture, GoldenRecordCase } from './index.js';
import { fixtures as defaultFixtures } from './index.js';

type AidModule = { parse: (txt: string) => unknown };

async function parseAid(txt: string) {
  const mod = (await import('@agentcommunity/aid')) as AidModule;
  return mod.parse(txt);
}

function loadFixtureFromPath(filePath: string): GoldenFixture {
  const abs = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  const data = fs.readFileSync(abs, 'utf8');
  const json = JSON.parse(data) as GoldenFixture;
  if (!json || !Array.isArray(json.records)) {
    throw new Error('Invalid fixture: missing records[]');
  }
  return json;
}

async function runFixture(fix: GoldenFixture) {
  let passed = 0;
  let failed = 0;

  for (const c of fix.records as GoldenRecordCase[]) {
    try {
      const parsed = await parseAid(c.raw);
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

  // Negative cases: expect parse to throw
  if (fix.invalid && Array.isArray(fix.invalid)) {
    for (const nc of fix.invalid) {
      try {
        await parseAid(nc.raw);
        failed += 1;
        console.error(`✗ ${nc.name}: expected error but parse succeeded`);
      } catch (err: unknown) {
        const ok =
          !nc.errorCode ||
          (typeof err === 'object' &&
            err !== null &&
            'errorCode' in err &&
            (err as { errorCode?: string }).errorCode === nc.errorCode);
        if (ok) {
          passed += 1;
        } else {
          failed += 1;
          console.error(`✗ ${nc.name}: error code mismatch`, err);
        }
      }
    }
  }

  console.log(`AID Conformance: ${passed} passed, ${failed} failed, total ${passed + failed}`);
  process.exitCode = failed === 0 ? 0 : 1;
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    await runFixture(defaultFixtures);
    return;
  }
  const fix = loadFixtureFromPath(arg);
  await runFixture(fix);
}

void main();
