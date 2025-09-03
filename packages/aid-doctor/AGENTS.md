# AGENTS.md

## Local dev
```bash
pnpm -C packages/aid-doctor dev
pnpm -C packages/aid-doctor build
node packages/aid-doctor/dist/cli.js check <domain>
```

## Global

```bash
pnpm i -g @agentcommunity/aid-doctor
aid-doctor check <domain>
```

## Notes

* Output must reference TTL bounds and required TXT format from spec
