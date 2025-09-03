# AID Terraform Showcase

This directory contains Terraform examples for publishing Agent Identity & Discovery (AID) TXT records using the Vercel provider. It is intended for local experimentation and CI validation only.

## Canonical Record

- The canonical record is published at `_agent.<domain>` as per spec §2. TXT contents use semicolon-delimited `key=value` pairs and must include `v=aid1`, `uri`, and `proto` (or alias `p`).
- Providers should set a TTL between 300–900 seconds (5–15 minutes) per spec §4.

## Optional Protocol-specific Subdomains

- Providers may optionally expose multiple services using protocol-specific subdomains in the underscore form (spec §2.4):
  - `_agent._mcp.<sub>.<domain>`
  - `_agent._a2a.<sub>.<domain>`
- These are not the default; the base `_agent.<domain>` remains primary. In `main.tf`, they are gated behind the variable `include_protocol_specific` (default `false`).

## Files

- `main.tf` — Creates example `_agent.<domain>` TXT records against a Vercel-managed zone. Includes optional protocol-specific examples when enabled.

## Usage (Local Only)

Requirements:

- Terraform >= 1.3
- Vercel provider `vercel/vercel` ~> 1.4

The provider expects the environment variable `VERCEL_API_TOKEN` (if you run plans against your account). Do not commit tokens or secrets.

Example workflow:

```bash
# From repo root
cd showcase/terraform

# (Optional) Check formatting
terraform fmt -check | cat

# Initialize
terraform init -input=false | cat

# Validate and plan (no apply)
terraform validate | cat
terraform plan -var "zone=example.com" -var "team_id=abc123" -var "record_ttl=360" -var "include_protocol_specific=false" -input=false | cat

# To preview protocol-specific examples (optional):
terraform plan -var "zone=example.com" -var "team_id=abc123" -var "include_protocol_specific=true" -input=false | cat
```

## Variables

- `zone` (string, required): Apex domain managed by Vercel (e.g., `agentcommunity.org`).
- `team_id` (string, required): Vercel team ID.
- `record_ttl` (number, default `360`): TTL for TXT records. Spec recommends 300–900 seconds.
- `include_protocol_specific` (bool, default `false`): If true, also create underscore protocol-specific examples. Optional only.

## Safety Notes

- Do not commit secrets. This is an examples directory; CI should pass tokens via environment variables only.
- Do not run `terraform apply` from this directory for production changes. These examples are for local validation and demonstration.

## References

- Specification: packages/docs/specification.md
- Relevant sections: §2 (TXT Record Specification), §2.4 (Optional protocol-specific subdomains), §4 (DNS and Caching TTL guidance).
