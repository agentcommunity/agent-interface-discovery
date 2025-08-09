// Local shape of an AID record for conformance purposes
export type AidRecord = {
  v: 'aid1';
  uri: string;
  proto: string;
  auth?: string;
  desc?: string;
};

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
