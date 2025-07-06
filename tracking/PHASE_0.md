# Phase 0 - Project Setup & Monorepo Hygiene

Started: 2025-07-05

- **[2025-07-05]** Workspace initialised: added `pnpm-workspace.yaml` and `turbo.json` (v2 `tasks` schema).
- **[2025-07-05]** Toolchain installed: Turbo 2, TypeScript 5, Prettier 3, ESLint (+unicorn), Husky, lint-staged, Changesets.
- **[2025-07-05]** Configured strict tooling: root `tsconfig.json`, `.eslintrc.json`, `.prettierrc`.
- **[2025-07-05]** Husky pre-commit hook set up to run lint-staged formatting.
- **[2025-07-05]** Changesets initialised for versioning (`.changeset` folder).
- **[2025-07-05]** Community health: added `.github/CODEOWNERS` and `pull_request_template.md`.
- **[2025-07-05]** Added GitHub Actions CI workflow (`ci.yml`) to run lint, build, and tests on pushes and PRs.
- **[2025-07-05]** Extended Turbo pipeline with `dev` and `clean` tasks.
- **[2025-07-05]** Added `docs/CONTRIBUTING-spec.md` detailing YAML contract workflow.
- **[2025-07-05]** GitHub Discussions enabled in repository settings.
