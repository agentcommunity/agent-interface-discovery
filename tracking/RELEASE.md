Below is a **slow-step, no-surprises checklist** for a staged v1.0.0 release.

---

## Status Update (2026-02-06)

- npm publishing now uses **GitHub OIDC Trusted Publishing** (no `NPM_TOKEN` required).
- PyPI publishing already uses OIDC pending publisher flow.
- `NPM_TOKEN` references below are legacy fallback notes only.
- npm Trusted Publisher entries required in npm UI:
  - `@agentcommunity/aid`
  - `@agentcommunity/aid-conformance`
  - `@agentcommunity/aid-doctor`
  - `@agentcommunity/aid-engine`

---

## Staged Release Plan: npm First, PyPI After Approval

**Constraint:** The `agent-community` project name on PyPI is pending approval. We cannot publish the Python package yet.

**Plan:**

1. **Phase 1:** Prepare everything, run the v1.0.0 Changeset, and publish all **npm packages**.
2. **Phase 2:** Once the PyPI project is approved, publish the already-versioned **Python package**.

## Go module release (manual, after merge)

The Go SDK is a nested v2 module. Do not tag it from a feature branch and do
not use a repository-root tag. A local tag is not a publication. After the
module-path change has merged, select the approved shared release version and
the exact intended `origin/main` SHA. Run this from a clean release checkout.
The placeholder SHA deliberately fails until the operator replaces it with the
approved full 40-character commit:

```bash
set -euo pipefail

# Current shared SDK release; change only if the owner approves a newer version.
version=v2.1.1
target='<approved 40-character origin/main SHA>'
module=github.com/agentcommunity/agent-identity-discovery/packages/aid-go/v2
tag="packages/aid-go/$version"

bash scripts/go-release-tag.sh "$version" "$target" "$module" "$tag"
```

The explicit `refs/tags/...` push is the publication step. Never force, delete,
or move this tag. If either local or remote state is unexpected, stop and choose
a new version after review. These rules follow Go's
[publishing guidance](https://go.dev/doc/modules/publishing) and
[subdirectory-tag mapping](https://go.dev/ref/mod#mapping-versions-to-commits).
`scripts/go-release-tag.sh` repeats every target, canonical-module, tag, local,
and remote check before it can create or push a tag. Its negative-path harness,
`bash scripts/test-go-release-tag-guard.sh`, proves that a mismatched target or
target `go.mod` module declaration cannot invoke the tag push.

Only after the remote annotated tag is exact, request and verify immutable
readback through the public Go proxy. The exact `GOPROXY` value intentionally
has no `direct` fallback:

```bash
set -euo pipefail

# Repeat these values when this readback block runs separately from tag publication.
version=v2.1.1
module=github.com/agentcommunity/agent-identity-discovery/packages/aid-go/v2
module_readback=/tmp/aid-go-module.json
pkg_readback=/tmp/aid-go-pkg.html
export GOPROXY=https://proxy.golang.org
export GOSUMDB=sum.golang.org

go list -m -json "$module@$version" > "$module_readback"
jq -e --arg module "$module" --arg version "$version" \
  '.Path == $module and .Version == $version' "$module_readback"

curl -fsSL "https://pkg.go.dev/$module@$version" > "$pkg_readback"
grep -Fq "$module" "$pkg_readback"
grep -Fq "$version" "$pkg_readback"
```

Inspect the pkg.go.dev page for the exact module/version, repository, license,
and rendered package documentation. A proxy success with a missing or stale
pkg.go.dev page is not complete publication evidence; wait for indexing and
repeat the readback. PAGE must not add or advertise the Go package until both
readbacks pass. No Go tag or module publication has occurred merely because
this checklist or the module-path source change exists.

---

## 0 . 5-second refresher: what the tokens are

| Token                             | What it’s for                                                                            | Where to create it                                                                | Where to store it                       |
| :-------------------------------- | :--------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- | :-------------------------------------- |
| **`NPM_TOKEN` (legacy fallback)** | Token-based npm publish path. Prefer OIDC trusted publishing instead.                    | npmjs.com → _Access Tokens_ → _Granular_                                          | GitHub secrets (only if not using OIDC) |
| **`PYPI_TOKEN` (DEFERRED)**       | Lets the Action upload wheels/sdists to PyPI with `twine upload`. **Set up in Phase 2.** | pypi.org → _Account Settings_ → _API tokens_                                      | Same GitHub Secrets panel               |
| _(optional)_ **`GH_RELEASE_PAT`** | Only if you want the Action to draft GitHub releases automatically.                      | GitHub → _Developer settings → Personal access tokens (classic)_ (scopes: `repo`) | GitHub Secrets                          |

- [ ] NPM_TOKEN in GitHub Secrets (legacy fallback only)
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

### **Phase 1: npm (OIDC active)**

- [x] `npm login` locally → verify you’re in the **@agentcommunity** org.
- [x] `npm whoami` – sanity check user.
- [x] Configure npm **Trusted Publisher** for each package/workflow in npm UI.
- [x] Release workflow uses OIDC (`id-token: write`) for npm publish.

### **Phase 2: PyPI (OIDC active)**

_Publishing currently uses PyPI Pending Publisher via OIDC; no API token required. See section 9._

---

## 4 . GitHub Actions files

- [x] The release workflow contains `changeset publish` using npm OIDC trusted publishing.
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

Below is a **branch-based, protected-main, staged-publish release checklist** that reflects the new reality:

- **`aid-web-generator` folded into `aid-doctor`**
- **main is protected — no direct pushes**
- **npm first, PyPI later**
- **dry-run pack command clarified**

---

FIANL STEPS:

## 0 . Pre-flight matrix (unchanged)

- Tokens, licences, ignore list, etc. already ticked — see previous checklist.

---

## 1 . Create the release branch (`release/v1.0.0`)

```bash
git switch -c release/v1.0.0 origin/main
pnpm clean && pnpm install --frozen-lockfile && pnpm build && pnpm test
```

_Everything must pass before you touch Changesets._

---

## 2 . Generate the single **major** Changeset

(affects every public npm package, including the new code in `aid-doctor`, but _ignores_ web / e2e / runners)

```bash
pnpm changeset add
# choose "major" → summary: "Initial stable release. Web generator merged into aid-doctor."
```

Commit the Changeset file:

```bash
git add .changeset
git commit -m "chore: create v1.0.0 changeset"
git push -u origin release/v1.0.0
```

---

## 3 . Open PR → **release/v1.0.0 → main**

- CI must be green (build / test / audit).
- Reviewers approve; but **do not squash-merge** (Changesets needs full commit).

---

## 4 . Merge PR — **main** now contains only the `.changeset/` entry

GitHub Actions does **nothing** yet (no version bump, no publish).

---

## 5 . Version & tag in _release branch_ (not on main)

We can’t push to main, so:

```bash
git switch release/v1.0.0   # already on this branch
git pull --ff-only origin main   # refresh with latest main

pnpm changeset version      # bumps every public pkg to 1.0.0, updates CHANGELOG
git add .
git commit -m "chore(release): v1.0.0 version bump"
git push
```

CI runs again on the branch; should still be green.

---

## 6 . PR #2 → merge the **version bump commit** into main

- Title: “chore(release): publish v1.0.0”
- After merge, main now has the bump commit → triggers **Changesets GitHub Action** which:
  1. Builds
  2. Runs `pnpm changeset publish` (publishes **npm** packages only, because the Python step is disabled)

Legacy token path needed:

```yaml
env:
  NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

_(only if you intentionally disable OIDC trusted publishing)._

---

## 7 . Verify npm release

```bash
npm info @agentcommunity/aid version            # → 1.0.0
npm info @agentcommunity/aid-doctor version     # → 1.0.0
```

Local install smoke-test:

```bash
npm init -y tmp && cd tmp
npm install @agentcommunity/aid@1
npx aid-doctor --help
cd .. && rm -rf tmp
```

---

## 8 . Draft & publish GitHub Release notes

(Mark Python status as “coming soon after PyPI namespace approval.”)

---

## 9 . PyPI Publishing: OIDC Route (Currently Active)

**Status Update:** We've implemented PyPI publishing via **OIDC Pending Publisher** since the `agent-community` org approval is taking too long.

### Current Implementation (v1.0.0):

- ✅ PyPI publishing uses GitHub Actions OIDC (no secrets needed)
- ✅ Pending publisher configured for `aid-discovery` project
- ✅ Workflow updated with `pypa/gh-action-pypi-publish@release/v1`
- ✅ Python package published as `aid-discovery` v1.0.0

### How It Works:

1. Workflow has `permissions: { id-token: write, contents: read }`
2. PyPI pending publisher authenticates via OIDC
3. First publish creates the project automatically
4. No `PYPI_TOKEN` secret required

### ⚠️ Critical Workflow Trigger Requirements:

The release workflow only runs when **BOTH** conditions are met:

1. **File trigger**: Push to main must change one of:
   - `packages/**/package.json` (npm releases)
   - `packages/**/pyproject.toml` (Python releases)
   - `CHANGELOG.md` or `.changeset/**`
2. **Message trigger**: Commit message must contain `chore(release)`

**Common gotcha**: If `pyproject.toml` doesn't actually change between commits (e.g., already at target version), the workflow won't trigger even with correct commit message!

### 🔧 Solution for Stuck Releases:

If the workflow doesn't trigger despite correct setup:

1. Create a temporary version downgrade (e.g., `1.0.0` → `0.1.0`)
2. Commit and then immediately bump back to target version (`0.1.0` → `1.0.0`)
3. Use `chore(release): bump Python package to vX.Y.Z` commit message
4. This creates the file change needed to satisfy trigger conditions

---

## 10 . Future Migration to Organization (After Approval)

**When the `agent-community` org is approved:**

1. **Transfer project ownership:**
   - PyPI → `aid-discovery` project → Settings → Transfer ownership → `agent-community`

2. **Optional: Switch to API token method:**
   - Generate project-scoped `PYPI_TOKEN` in the org account
   - Add to GitHub Secrets
   - Update workflow to use token instead of OIDC

3. **No version bumps needed** - just ownership transfer

### Legacy API Token Method (for reference):

```yaml
- name: Publish PyPI
  env:
    TWINE_USERNAME: '__token__'
    TWINE_PASSWORD: ${{ secrets.PYPI_TOKEN }}
  run: |
    cd packages/aid-py
    python -m build --sdist --wheel
    twine upload dist/*
```

---

## 11 . Fix for the dry-run command

Earlier failure came from filtering paths. Use workspace filter:

```bash
# Dry-run npm packs for every public JS package
pnpm -r --filter "@agentcommunity/*" --filter="!@agentcommunity/aid-py-test-runner" exec npm pack --dry-run
```

Or, simpler:

```bash
pnpm -r exec npm pack --dry-run
```

(Turbo/PNPM will still skip private packages listed with `"private": true` in `package.json`.)

---

## 12 . Update ignore list (aid-web-generator is gone)

`.changeset/config.json`

```json
"ignore": [
  "@agentcommunity/aid-web",
  "@agentcommunity/e2e-tests",
  "@agentcommunity/aid-go-test-runner",
  "@agentcommunity/aid-py-test-runner"
]
```

---

### Recap

**npm packages (completed):**

1. **release/v1.0.0 branch**: changeset add → PR #1
2. Merge PR #1 → main (only changeset entry)
3. Version bump on same branch → PR #2
4. Merge PR #2 → main → CI publishes npm 1.0.0

**Python package (current approach):**

1. **release/v1.0.0-python branch**: direct version bump + OIDC workflow
2. PR → main → merge → CI publishes `aid-discovery` v1.0.0 to PyPI via OIDC
3. Project ownership transfer to org when approved (no code changes needed)

Take it slow, tick each box, and you'll ship without tripping the protected-main rule or PyPI delay.
