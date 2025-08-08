import type { AidRecord } from '@agentcommunity/aid';

// Re-export the shared golden fixtures without duplicating the file.
// Using a relative path to the repository-level fixture per instruction.
import golden from '../../../test-fixtures/golden.json';

export type GoldenRecordCase = {
  name: string;
  raw: string;
  expected: AidRecord;
};

export type GoldenFixture = {
  records: GoldenRecordCase[];
};

export const fixtures: GoldenFixture = golden as unknown as GoldenFixture;

export { type AidRecord } from '@agentcommunity/aid';
