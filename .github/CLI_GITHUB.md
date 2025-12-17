# CI Optimization Strategy

We have optimized our GitHub Actions workflows to significantly reduce build times and prevent unnecessary resource usage.

## The Problem

Previously, every `push` or `pull_request` triggered all CI workflows (TypeScript, Go, Java, Python, Rust, .NET, etc.), regardless of which files were actually modified. This resulted in:

- Long queue times.
- Wasted GitHub Actions minutes.
- Delayed feedback for simple changes.

## The Solution: Path Filters

We have applied specific `paths` filters to all workflows. Now, a workflow only runs if the commit touches files relevant to that specific subsystem.

### Optimization Matrix

| Workflow            | Triggers Only On Changes To...                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| **CI (TypeScript)** | `packages/aid*`, `packages/web`, `packages/e2e-tests`, `scripts/`, `protocol/`, `package.json` |
| **CI (Go)**         | `packages/aid-go/**`, `protocol/**`                                                            |
| **CI (Java)**       | `packages/aid-java/**`, `protocol/**`                                                          |
| **CI (Python)**     | `packages/aid-py/**`, `protocol/**`                                                            |
| **CI (Rust)**       | `packages/aid-rs/**`, `protocol/**`                                                            |
| **CI (.NET)**       | `packages/aid-dotnet/**`, `protocol/**`                                                        |
| **Parity Check**    | Any `packages/**` or `protocol/**` (to ensure cross-language consistency)                      |
| **Security Scan**   | Source code, protocol definitions, or lockfiles                                                |

## Result

- **Frontend changes** (e.g., `packages/web`) no longer trigger Go/Rust/Java builds.
- **SDK-specific changes** only trigger that SDK's CI + the general parity check.
- **Protocol changes** correctly trigger everything to ensure conformity.
