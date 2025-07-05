# Contributing to the AID Specification

The spec is **contract-first**. All protocol constants and types live in a single YAML file (`protocol/constants.yml`). Generator scripts transform that YAML into language-specific constant modules and typings.

## Proposing a Change

1. Fork the repo and create a branch.
2. Edit **`protocol/constants.yml`** – follow alphabetical order, update the `schemaVersion` if the change is breaking.
3. Run `pnpm gen` to regenerate code.
4. Commit **both** the YAML change **and** the generated artifacts in the same commit.
5. Open a PR and describe the rationale.

## Adding a New Token

• Add the new token under the correct section in the YAML, keeping keys sorted.
• Provide a short descriptive comment.

## Validation

CI will fail if:

- Generated files differ from committed versions.
- Token keys are not alphabetically sorted.

## Code Style

Generated files are formatted automatically. Do not hand-edit generated files; edit the YAML instead.
