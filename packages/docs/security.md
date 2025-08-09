---
title: 'Security Best Practices'
description: 'Operational and client guidance for secure AID usage.'
icon: material/shield-lock
edit_url: https://github.com/agentcommunity/agent-interface-discovery/edit/main/packages/docs/security.md
---

# Security Best Practices

This guide summarizes key operational and client-side recommendations from the specification and expands them with practical steps.

## DNSSEC

- Providers: enable DNSSEC signing on your zone. Most managed DNS providers (e.g., Cloudflare, Vercel) make this a one-click operation.
- Clients: when possible, prefer resolvers that validate DNSSEC (AD-bit) or perform explicit validation. Expose an opt-in flag (e.g., `--require-dnssec`).

## HTTPS and Redirects

- Remote agent URIs MUST use `https://`.
- Clients SHOULD block cross-origin first-hop redirects from the discovered URI, or require explicit user consent.

## Local Execution Safeguards (`proto=local`)

- Obtain explicit user consent before first run; show the resolved command.
- Fingerprint the `uri` + `proto` and re-prompt on change.
- Do not pass shell-interpreted strings; invoke processes with argument arrays.
- Avoid nested discovery triggers. Prefer sandboxing (e.g., container restrictions) when possible.

## IDN Safety

- Providers: avoid confusing lookalike domains when possible.
- Clients: warn on potential homoglyph/confusable domains in user-facing tools.

## TTL and Caching

- Providers: use TTL 300–900 seconds for `_agent.<domain>`.
- Clients: respect TTL and do not cache beyond it.

## Operational Checklist

- DNSSEC enabled; `_agent` TXT present; TTL 300–900.
- No secrets in TXT; URI uses `https://` for remote protocols.
- Local execution policies documented and enforced by host applications.
