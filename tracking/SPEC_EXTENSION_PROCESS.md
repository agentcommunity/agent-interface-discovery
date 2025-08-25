# Spec extension process (for future proposals)

When expanding the spec (new tokens/fields/rules), follow this process to stay contract-first and multi-language consistent.

## 1) Open a proposal issue
- Label: `spec-proposal`
- Include: motivation, examples, security implications, backward compatibility, and migration considerations.

## 2) Draft changes in docs
- Update `packages/docs/specification.md` in a draft PR using normative language and references.
- Clearly mark sections as “Proposed”.

## 3) Update canonical constants (upon acceptance)
- Edit `protocol/constants.yml` only for accepted proposals.
- Run `pnpm gen` to regenerate constants across SDKs.
- Commit the YAML and all generated files.

## 4) Multi-language guards
- Implement validation and error semantics in TypeScript first; mirror in Python and Go.
- Update `test-fixtures/golden.json` and parity tests; ensure green in all languages.

## 5) Versioning & migration notes
- Add a Changeset; bump affected packages according to semver.
- Document migration in `packages/docs/versioning.md`.
- If breaking, provide opt-in flags or transitional behavior until v2.

## 6) Release & communicate
- Merge docs and code together; run full CI.
- Publish affected packages.
- Announce in README/docs and link back to the proposal issue for rationale.

## Checklist for any spec-change PR
- [ ] Proposal issue with rationale and security review
- [ ] `protocol/constants.yml` updated and regenerated
- [ ] TS/Py/Go validation + tests updated
- [ ] Parity suite green
- [ ] Docs/spec updated
- [ ] Changeset added and CI green
