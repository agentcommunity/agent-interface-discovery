# AGENTS.md

## Build and test
```bash
pnpm -C packages/aid build
pnpm -C packages/aid test
pnpm -C packages/aid run test:coverage
```

## API contracts

`packages/aid/src/constants.ts` must export:

```
DNS_SUBDOMAIN
DNS_TTL_MIN
DNS_TTL_MAX
LOCAL_URI_SCHEMES
RawAidRecord
```

## Style

* Strict TS
* `tsup` builds ESM and CJS with d.ts
* Prefer named exports
