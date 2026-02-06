# Handoff: Web Focus Cleanup

**Branch:** `claude/review-web-focus-cleanup-4uNVu`
**Base:** `71631b1` (Feat/next16 react19 modernization #79)
**Commits:** 5 (see below)

---

## How to get this branch locally

```bash
# 1. Make sure your local work is committed on main
git stash   # or git commit, if you have uncommitted changes

# 2. Fetch the branch
git fetch origin claude/review-web-focus-cleanup-4uNVu

# 3. Check it out (force-create local branch matching remote exactly)
git checkout -B claude/review-web-focus-cleanup-4uNVu origin/claude/review-web-focus-cleanup-4uNVu

# 4. Install deps and build (aid-engine must be built before web works)
pnpm install
pnpm build

# 5. Run the dev server
pnpm dev:web
# Open http://localhost:3000
```

If you previously had merge conflicts on this branch, the `-B` flag in step 3 forces the local branch to match the remote exactly (discards any conflicted state). Your `main` branch is untouched.

---

## What was done (5 commits)

### Commit 1: `1891f79` — Decompose workbench into focused modules

Broke 3 large files (~1,250 lines) into 12 focused modules with backward-compatible re-export facades:

| Original file | Extracted modules |
|---|---|
| `tool-blocks.tsx` (557 lines) | `blocks/discovery-block.tsx`, `blocks/connection-block.tsx`, `blocks/shared.tsx`, `blocks/index.ts` |
| `use-chat-engine.ts` (382 lines) | `chat-engine/hook.ts`, `chat-engine/orchestration.ts`, `chat-engine/reducer.ts`, `chat-engine/types.ts`, `chat-engine/index.ts` |
| `generator-panel.tsx` (309 lines) | `generator/preview-panel.tsx`, `generator/validation-summary.tsx`, `use-generator-form.ts` |

Original files kept as thin re-exports so existing imports don't break.

### Commit 2: `99b75e7` — Curate examples, SDK snippets, generator pre-fill

- Trimmed default example picker to 6 curated picks (from all 17)
- Added `sdk-snippets.ts` — generates connect snippets for TypeScript, Python, Go, Rust, .NET, Java
- Added `connect-snippet.tsx` — tabbed SDK snippet panel shown after discovery
- Wired sessionStorage bridge: clicking "Edit in Generator" from resolver pre-fills the generator form

### Commit 3: `e666613` — Swap A2A for UCP, polish chat UI

- Replaced A2A with UCP in the curated 6 examples
- Added design-token CSS variables for chat colors (globals.css)
- Bot avatar for assistant messages (lucide `Bot` icon)
- Replaced hardcoded gray colors with `text-foreground` / `text-muted-foreground` tokens

### Commit 4: `02f6055` — Landing page clarity

- **hero.tsx**: Removed animated token counter (unverifiable metric), replaced with static "9 protocols · 6 SDKs · MIT licensed" badge
- **quick-start.tsx**: Fixed `u=` → `uri=` alias in DNS snippet, changed Terraform example from `p=mcp` to `p=openapi` (shows protocol flexibility), renamed Step 3 from "Install Engine" to "Validate" with `aid-doctor` CLI
- **identity.tsx**: Fixed `u=` → `uri=` alias, added alias explanation text
- **solution.tsx**: Added `.well-known/agent` fallback mention, protocol badges (mcp, a2a, openapi, etc.)

### Commit 5: `027e27b` — Colorful icons, collapsible results, show-all examples

- **Landing page icons**: Added semantic color accents — blue (DNS), amber (well-known), purple (protocols), emerald (PKA), red/orange/rose (problem cards), indigo/orange (vision)
- **Collapsible chat results**: New `collapsible-result.tsx` component wrapping discovery/connection/summary results with expand/collapse. Shows status icon + one-line summary, click to expand technical details
- **Example picker "show more"**: Toggle to expand from 6 curated → all 17 examples grouped by category (Tutorials, Real World, Protocols, Reference, Edge Cases)

---

## Files changed (31 files, +1861 / -1539)

### New files
- `packages/web/src/components/workbench/blocks/connection-block.tsx`
- `packages/web/src/components/workbench/blocks/discovery-block.tsx`
- `packages/web/src/components/workbench/blocks/shared.tsx`
- `packages/web/src/components/workbench/blocks/index.ts`
- `packages/web/src/components/workbench/collapsible-result.tsx`
- `packages/web/src/components/workbench/connect-snippet.tsx`
- `packages/web/src/components/workbench/generator/preview-panel.tsx`
- `packages/web/src/components/workbench/generator/validation-summary.tsx`
- `packages/web/src/hooks/chat-engine/hook.ts`
- `packages/web/src/hooks/chat-engine/orchestration.ts`
- `packages/web/src/hooks/chat-engine/reducer.ts`
- `packages/web/src/hooks/chat-engine/types.ts`
- `packages/web/src/hooks/chat-engine/index.ts`
- `packages/web/src/hooks/use-generator-form.ts`
- `packages/web/src/lib/sdk-snippets.ts`

### Modified files
- `packages/web/src/components/landing/hero.tsx`
- `packages/web/src/components/landing/quick-start.tsx`
- `packages/web/src/components/landing/identity.tsx`
- `packages/web/src/components/landing/solution.tsx`
- `packages/web/src/components/landing/features.tsx`
- `packages/web/src/components/landing/vision.tsx`
- `packages/web/src/components/workbench/discovery-chat.tsx`
- `packages/web/src/components/workbench/example-picker.tsx`
- `packages/web/src/components/workbench/title-section.tsx`
- `packages/web/src/components/workbench/tool-blocks.tsx` (now a thin re-export facade)
- `packages/web/src/components/workbench/generator-panel.tsx` (now a thin re-export facade)
- `packages/web/src/hooks/use-chat-engine.ts` (now a thin re-export facade)
- `packages/web/src/app/workbench/page.tsx`
- `packages/web/src/app/globals.css`
- `packages/web/WORKBENCH_COMPONENTS_2.md`

---

## How to test

### Prerequisites

```bash
pnpm install
pnpm build          # builds aid, aid-engine, and web
pnpm dev:web        # http://localhost:3000
```

### Quality gates (all must pass)

```bash
pnpm -C packages/web type-check   # TypeScript strict mode
pnpm -C packages/web lint          # ESLint (--max-warnings 0)
pnpm -C packages/web test          # Vitest
```

These all passed at the time of the last commit.

### Manual testing checklist

#### Landing page (http://localhost:3000)

- [ ] Hero shows static "9 protocols · 6 SDKs · MIT licensed" badge (no animated counter)
- [ ] Quick Start Step 1 (Discover) shows `uri=` (not `u=`) in DNS snippet
- [ ] Quick Start Step 2 (Publish) Terraform snippet shows `p=openapi`
- [ ] Quick Start Step 3 is "Validate" with `aid-doctor check` CLI command
- [ ] Solution cards have colored icons (blue, amber, purple, emerald) — not gray
- [ ] Solution card #3 shows protocol badges (mcp, a2a, openapi, grpc, graphql, websocket, ucp)
- [ ] Solution card #2 mentions `.well-known/agent` fallback
- [ ] Features "problem" cards have colored icons (red, orange, amber, rose)
- [ ] Vision cards have colored icons and accent dots (indigo, orange)
- [ ] PKA/Identity section has emerald-colored icons and alias explanation text

#### Resolver / Chat (http://localhost:3000 → click "Try the Workbench" or navigate to resolver)

- [ ] Example picker shows 6 curated examples by default
- [ ] "Show all 17 examples" button expands to grouped view (Tutorials, Real World, Protocols, Reference, Edge Cases)
- [ ] "Show less" collapses back to 6
- [ ] Clicking an example submits the domain and shows chat flow
- [ ] **Discovery results are collapsible** — shows one-line status bubble (green check / red X), click to expand technical details
- [ ] **Connection results are collapsible** — shows "Connected via mcp" or "Connection failed" bubble
- [ ] **Summary/capabilities are collapsible** — shows "Agent capabilities" bubble
- [ ] Assistant messages have Bot avatar icon
- [ ] Chat uses design-token colors (not hardcoded grays)
- [ ] SDK snippets panel appears after successful discovery (tabs: TypeScript, Python, Go, Rust, .NET, Java)

#### Generator (http://localhost:3000#generator)

- [ ] Generator form loads correctly
- [ ] "Edit in Generator" from resolver pre-fills the generator form via sessionStorage

---

## Known issue: Example resolution failures

**Status:** Under investigation. DNS records exist on Vercel (confirmed via dashboard). Discovery may fail if:

1. **NS delegation**: Check that `agentcommunity.org` nameservers point to Vercel (`dig NS agentcommunity.org +short`). Records in the Vercel dashboard are invisible to the internet if NS points elsewhere.

2. **Verify DoH resolution** (this is exactly what the browser SDK does):
   ```bash
   curl -s "https://cloudflare-dns.com/dns-query?name=_agent.simple.agentcommunity.org&type=TXT" \
     -H "Accept: application/dns-json" | jq .
   ```
   If this returns an Answer with the TXT record, DNS is fine and the issue is in the browser code.

3. **Browser console**: Open DevTools → Console while clicking an example. Error codes:
   - `ERR_NO_RECORD` — Cloudflare DoH returned no TXT record (NS delegation issue)
   - `ERR_SECURITY` — DoH fetch failed or timed out (network/firewall issue)
   - `ERR_INVALID_TXT` — Record found but parser rejected it

4. **PKA failures**: Examples with PKA keys (`pka-basic`, `secure`, `complete`, `supabase`, `auth0`, `playwright`, `a2a`) attempt a PKA handshake to the URI during discovery. If the server doesn't exist, PKA fails, the SDK silently catches it, and moves to the next TXT record. If there's only one record, discovery fails with `ERR_NO_RECORD` even though the DNS record exists. This is a design issue in the browser SDK — PKA verification should probably be a separate post-discovery step.

5. **Deprecated example**: `deprecated.agentcommunity.org` has `e=2025-12-31T23:59:59Z` (past date). The parser rejects it. Update the date in `protocol/examples.yml` and run `pnpm gen`.

6. **Duplicate DNS records**: Some domains have two TXT records from different terraform runs (old 10/6/25 with underscores, new 12/4/25 with hyphens). The old records should be cleaned up in Vercel DNS dashboard.

### Architecture note on resolution

The browser SDK (`@agentcommunity/aid/browser`) resolves DNS via **Cloudflare DNS-over-HTTPS** (`cloudflare-dns.com/dns-query`). This is a free public resolver — no Cloudflare account needed. The records are hosted on **Vercel DNS**; Cloudflare just resolves them (like how `8.8.8.8` resolves any domain). The flow:

```
Browser → fetch(cloudflare-dns.com/dns-query?name=_agent.simple.agentcommunity.org&type=TXT)
       → Cloudflare resolves via Vercel NS
       → Returns TXT record
       → SDK parses with parse()
       → LiveDatasource wraps result
```

### Potential fix approaches

- **Quick fix**: If PKA is the culprit, skip PKA verification during discovery (do it post-discovery instead). Modify `packages/aid/src/browser.ts` lines 301-303.
- **Resilient fix**: Add the embedded `content` string from each example as a fallback in orchestration.ts when LiveDatasource fails for `*.agentcommunity.org` domains.
- **Infrastructure fix**: Ensure NS delegation is correct, clean up duplicate DNS records, trigger terraform apply via GitHub Actions `workflow_dispatch`.

---

## Spec reminder

`packages/docs/specification.md` is the canonical spec — **do not modify**.
Protocol constants come from `protocol/constants.yml` → run `pnpm gen` to regenerate.
