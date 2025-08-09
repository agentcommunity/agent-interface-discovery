# @agentcommunity/aid-conformance

Conformance fixtures and a tiny runner for Agent Interface Discovery (AID).

- Exposes the shared `test-fixtures/golden.json` via a typed export
- Provides a simple Node runner to execute the fixtures against a parser

## Install

```bash
pnpm add -D @agentcommunity/aid-conformance
# or
npm i -D @agentcommunity/aid-conformance
```

## Usage (Node / TypeScript)

```ts
import { fixtures, type GoldenFixture } from '@agentcommunity/aid-conformance';
import { parse } from '@agentcommunity/aid';

for (const c of fixtures.records) {
  const record = parse(c.raw);
  // assert deep equality with c.expected
}
```

To use from other language repos, consume the published package tarball as a dev artifact or copy the JSON path after installation:

- The JSON is reused from the repo at `test-fixtures/golden.json` and is included in the published bundle (no duplication in source).

## CLI

Run the built-in runner with the shared fixtures (default) or a custom file path:

```bash
# default fixtures
npx aid-conformance

# custom fixture
npx aid-conformance ./some-fixture.json
```

Exit code is non-zero if any case fails. Output includes a concise summary.

## Development

- Build: `pnpm build`
- Test: `pnpm test`
- Lint: `pnpm lint`

## License

MIT © Agent Community
