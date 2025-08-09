# @agentcommunity/aid

Agent Interface Discovery (AID) – Core TypeScript library for Node.js and Browsers.

- Canonical spec: see the monorepo docs and `protocol/constants.yml`
- Website: https://aid.agentcommunity.org
- Docs: https://docs.agentcommunity.org/aid

## Install

```bash
pnpm add @agentcommunity/aid
# or
npm install @agentcommunity/aid
# or
yarn add @agentcommunity/aid
```

## Quick Start (Node.js)

```ts
import { discover, AidError } from '@agentcommunity/aid';

try {
  const { record, ttl, queryName } = await discover('example.com');
  console.log('Found', record.proto, 'at', record.uri, 'TTL:', ttl, 'query:', queryName);
} catch (e) {
  if (e instanceof AidError) {
    console.error(`AID Error (${e.code})`, e.errorCode, e.message);
  } else {
    console.error('Unexpected error', e);
  }
}
```

## Quick Start (Browser)

```ts
import { discover } from '@agentcommunity/aid/browser';

const { record } = await discover('example.com');
console.log('Agent:', record.proto, record.uri);
```

## API

- `discover(domain: string, options?)` → `{ record, ttl, queryName }`
  - Node uses DNS; Browser uses DNS-over-HTTPS.
  - Canonical query is `_agent.<domain>`. When a specific protocol is requested, clients may query `_agent._<proto>.<domain>` as an optimization.
- `parse(txt: string)` → validated AID record
- `AidError` – error class exposing `code` (numeric) and `errorCode` (symbol)
- Constants and types exported from `@agentcommunity/aid`

## Error Codes

- `1000` `ERR_NO_RECORD` – no `_agent` TXT found
- `1001` `ERR_INVALID_TXT` – malformed record
- `1002` `ERR_UNSUPPORTED_PROTO` – protocol not supported
- `1003` `ERR_SECURITY` – security policy violation
- `1004` `ERR_DNS_LOOKUP_FAILED` – DNS lookup failed

## Security Notes

- Remote agent URIs MUST use `https://`.
- See the spec for redirect handling and local execution guidance.

## License

MIT © Agent Community
