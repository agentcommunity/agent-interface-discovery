Summary: Scoped lint-staged.

Files: `.lintstagedrc.json`

Commands run:
- `git add -A && npx lint-staged -d`
- `pnpm lint`

Result:
- lint-staged dry run showed only repo-scoped patterns and no traversal outside the workspace. It detected only the staged `.lintstagedrc.json` and produced tasks limited to:
  - `packages/**/*.{js,jsx,ts,tsx}` → eslint
  - `{packages,protocol,scripts}/**/*.{js,jsx,ts,tsx,json,md,yml,yaml}` → prettier
  - `README.md` → prettier
  - `.github/**/*.{yml,yaml,md}` → prettier
- Lint across workspace succeeded with no errors.

Timestamp: 2025-08-10T00:00:00Z