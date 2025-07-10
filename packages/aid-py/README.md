# aid-discovery (Python)

> Work-in-progress Python implementation of the Agent Interface Discovery (AID) specification.

This package will provide:

- `discover(domain: str)` – DNS lookup helper to fetch a domain's `_agent` TXT record.
- `parse(txt: str)` – deterministic parser that validates and returns an `AidRecord`.
- `AidError` – rich error class mapping spec error codes.

**Status:** In development – targeting feature parity with the TypeScript reference implementation.

To run tests, use the monorepo's unified test command from the root directory:
`pnpm test`
