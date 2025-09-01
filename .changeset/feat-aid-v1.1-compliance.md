---
'@agentcommunity/aid': minor
---

feat(aid): align TS client with v1.1 spec

- Implement spec-compliant protocol resolution logic (underscore prefix only).
- Add `.well-known` fallback to browser client for feature parity.
- Add handling for `dep` (deprecation) field with warnings and errors.
- Refactor `canonicalizeRaw` into shared parser module.
- Add comprehensive tests for new features and compliance fixes.
