Below is a **slow-step, no-surprises checklist** for a staged v1.0.0 release.

---

## Staged Release Plan: npm First, PyPI After Approval

**Constraint:** The `agent-community` project name on PyPI is pending approval. We cannot publish the Python package yet.

**Plan:**

1. **Phase 1:** Prepare everything, run the v1.0.0 Changeset, and publish all **npm packages**.
2. **Phase 2:** Once the PyPI project is approved, publish the already-versioned **Python package**.

---

## 0 . 5-second refresher: what the tokens are

| Token                             | What it’s for                                                                            | Where to create it                                                                | Where to store it                       |
| :-------------------------------- | :--------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- | :-------------------------------------- |
| **`NPM_TOKEN`**                   | Lets the GitHub Action run `npm publish` on your behalf.                                 | npmjs.com → _Access Tokens_ → _Automation_                                        | GitHub → _Settings → Secrets → Actions_ |
| **`PYPI_TOKEN` (DEFERRED)**       | Lets the Action upload wheels/sdists to PyPI with `twine upload`. **Set up in Phase 2.** | pypi.org → _Account Settings_ → _API tokens_                                      | Same GitHub Secrets panel               |
| _(optional)_ **`GH_RELEASE_PAT`** | Only if you want the Action to draft GitHub releases automatically.                      | GitHub → _Developer settings → Personal access tokens (classic)_ (scopes: `repo`) | GitHub Secrets                          |

- [x] NPM_TOKEN in GitHub Secrets
- [ ] PYPI_TOKEN (deferred)
- [x] GH_RELEASE_PAT (in progress)

---

## 1 . License & metadata sanity

_This is now complete for all packages, including Python._

- [x] **One root `LICENSE` file** (MIT)
  - [x] _Copied into each public package’s `files` array._
- [x] **`license` field** in _every_ `package.json` – matches the root license.
- [x] **`author` / `repository` fields** present for OSS optics.
- [x] Private packages set `"private": true` **and** `publishConfig.access: "restricted"`.
- [x] Public packages set `publishConfig.access: "public"` (needed for scoped packages).

---

## 2 . Version baseline

- [x] All publishable packages (JS and Python) are **≤ 0.1.x** right now.
- [ ] **Important:** The Changeset workflow will bump **all** public packages to 1.0.0 in one go. We will configure the workflow to _only publish the npm packages_ for now. This keeps our versions in sync.
- [x] Internal/private packages can stay at 0.0.0; Changesets will ignore them (they’re in `ignore` list).

---

## 3 . Registry access

### **Phase 1: npm (Done)**

- [x] `npm login` locally → verify you’re in the **@agentcommunity** org.
- [x] `npm whoami` – sanity check user.
- [x] Create **Automation token** (done, see above).
- [x] Put it in GH Secrets as **`NPM_TOKEN`**.

### **Phase 2: PyPI (Deferred)**

- [ ] Once the `agent-community` project is approved, create it on PyPI.
- [ ] In PyPI Settings → API tokens → **Add** a token scoped to the project.
- [ ] Copy the token to GH Secrets as **`PYPI_TOKEN`**.
- [ ] Un-comment the Python publish step in the release workflow.

---

## 4 . GitHub Actions files

- [x] The release workflow contains a `changeset publish` step with `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` env set.
- [x] **The Python publish job/step is temporarily disabled.**
- [x] Matrix builds pass under `pnpm install --frozen-lockfile`.
- [x] Workflow that builds `packages/web` uses **Node 20** (Next 14’s recommend).

---

## 5 . npm package contents

For every public **npm** package:

- [x] `files` array or `.npmignore` excludes `/src`, tests, storybook assets, etc.
- [x] Bundle size under control (`npm pack --dry-run` shows only `dist/**`, `README`, `LICENSE`).
- [x] CLI packages have correct shebang (`#!/usr/bin/env node`) and `bin` field.

---

## 6 . Final local dry-runs

### **Phase 1 Dry-Run (Do this now)**

```bash
# Dry-run Changeset bump
pnpm changeset status      # Inspect what will be versioned and published

# Dry-run pack for each public npm package
pnpm -r --filter="./packages/*" --filter="!./packages/aid-py" exec npm pack --dry-run
```

### **Phase 2 Dry-Run (Do this later)**

_When you're ready to publish the Python package, run these checks:_

```bash
# Check Python build and distribution artifacts
cd packages/aid-py
python -m build --sdist --wheel
twine check dist/*
```

---

## 7 . Team communication / permissions

- [ ] All org owners on npm have **2-factor auth** enabled (requirement for Automation tokens).
- [ ] At least two maintainers on npm & PyPI in case someone’s on vacation.
- [ ] Slack / Discord #release channel created for day-of chatter.

---

## 8 . Changelog prep

- [ ] `pnpm changeset` already created with summary.
- [ ] `CHANGELOG.md` exists at root—Changesets will append.

---

## 9 . Release-day commands (Phase 1: npm Publish)

_These commands version everything, but the modified CI workflow will only publish to npm._

```bash
git switch main && git pull
pnpm clean && pnpm install --frozen-lockfile && pnpm build && pnpm test

pnpm changeset version        # Bumps versions on all packages locally
git add . && git commit -m "chore(release): v1.0.0"
git tag -s v1.0.0 -m "Release v1.0.0"
git push origin main v1.0.0   # Triggers the modified publish workflow
```

---

## 10 . Post-publish validation

### **Phase 1 Validation (After npm publish)**

- [ ] `npm info @agentcommunity/aid version` shows `1.0.0`.
- [ ] GitHub Release notes drafted & published.

### **Phase 2 Validation (After PyPI publish)**

- [ ] `pip install agent-community==1.0.0` works in a fresh venv.
- [ ] The GitHub Release can be updated to mention the Python package is now live.

---

## 11 . `changeset/config.json` (For Reference)

This configuration does not need to change. Changesets will correctly version all packages, including the Python one. We are only controlling the _publish_ step in the CI workflow.

```json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [
    "@agentcommunity/aid-web",
    "@agentcommunity/e2e-tests",
    "@agentcommunity/aid-go-test-runner",
    "@agentcommunity/aid-py-test-runner"
  ]
}
```

---

### Quick ELI5 summary

_Tokens_ are secret API keys that let GitHub do the `npm publish` / `twine upload` for you. You create them once on npm/PyPI, store them in GitHub _Secrets,_ and your workflow reads them when it’s time to publish.

We will follow this staged plan:

1.  **First, we'll get the `NPM_TOKEN` and modify our GitHub Action to skip the Python release.**
2.  Then, we'll run the release commands to publish all the **JavaScript packages** to npm.
3.  **Later,** once PyPI approves our project name, we'll add the `PYPI_TOKEN` and re-enable the Python step to publish it.
