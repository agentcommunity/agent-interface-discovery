import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';

import { parse } from './parser.js';

interface FixtureRecord {
  name: string;
  raw: string;
  expected: Record<string, unknown>;
}

const __dirnameFix = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(__dirnameFix, '../../..', 'test-fixtures', 'golden.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as { records: FixtureRecord[] };

describe('cross-language parity – TypeScript parser', () => {
  for (const rec of fixture.records) {
    it(`parses ${rec.name}`, () => {
      const parsed = parse(rec.raw);
      expect(parsed).toEqual(rec.expected);
    });
  }
});
