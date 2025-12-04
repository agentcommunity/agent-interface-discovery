<!-- 43b58f45-79db-4e82-8553-5e55e9c7a1d2 8d72c686-c06c-4b03-b624-91e3ab09e3b7 -->
# Create Protocol-Aware Workbench PRD

## Task

Create a single file `PLAN.md` in the project root that documents:

1. Current state of the codebase (what works, what doesn't)
2. The problem with the web workbench
3. Minimal changes required to fix it
4. File-by-file implementation guide

## File to Create

- [PLAN.md](PLAN.md) - New PRD document

## Content Structure

The document will include:

- Executive summary of the issue
- Current state assessment (spec, aid SDK, aid-engine, aid-doctor, web workbench)
- Problem statement with code references
- Solution approach
- Implementation checklist with specific file paths and changes
- Acceptance criteria
- Cleanup instructions (delete PLAN.md when done)

## Key Points to Document

1. The AID spec and all SDKs/tooling correctly support 8 protocols
2. The web workbench discovery works for all protocols
3. The web workbench connection test only works for MCP (the bug)
4. Fix requires ~5 files with targeted changes
5. No new protocol handlers needed - just protocol-aware routing