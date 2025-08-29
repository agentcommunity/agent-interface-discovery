---
title: "Agent Interface Discovery 'aid'"
description: 'Specification'
icon: material/file-document-outline

extra_css_class: aid-page

tags:
  - v1
  - '2025-07-05'
---

[View raw markdown](https://github.com/agentcommunity/agent-interface-discovery/raw/main/packages/docs/specification.md)

# **Agent Interface Discovery (AID) — v1.0.0**

_Minimal, DNS-only agent bootstrap standard_

**Date:** 5 July 2025
**Editor:** Agent Community
**Status:** Final

---

## **Abstract**

Agent Interface Discovery (AID) answers one question: **"Given a domain, where is the agent and which protocol should I speak?"** It does so with a single DNS TXT record at a well-known subdomain: `_agent.<domain>`.

This protocol is an intentionally minimal discovery layer. After a client uses AID to find the correct endpoint or package, richer protocols such as the Model Context Protocol (MCP) or the Agent-to-Agent Protocol (A2A) take over for communication and capability negotiation.

This document defines the record format, a simple client algorithm, and strict security rules. It does not include manifests, capability lists, or runtime orchestration.

---

## **0. Glossary**

| Term                  | Meaning                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------ |
| **AID Client**        | Any software that performs discovery according to this specification.                      |
| **Provider**          | The entity that controls a domain and is responsible for publishing the AID TXT record.    |
| **\_agent subdomain** | The well-known subdomain `_agent.<domain>` where the AID TXT record **MUST** be published. |
| **A-label**           | The Punycode representation of an Internationalized Domain Name (IDN), as per [RFC5890].   |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC2119] and [RFC8174].

---

## **1. Design Goals**

- **Zero-Configuration:** A user types a domain, and the client automatically discovers how to connect.
- **Decentralized and Deployable:** The standard uses DNS TXT records, which are universally supported and require no central registry.
- **Protocol-Agnostic:** AID discovers agents speaking any protocol, including MCP, A2A, OpenAPI, or even local package-based protocols.
- **Clear Upgrade Path:** A future AID v2 is planned to use DNS SRV records, leveraging the same `_agent` service label established in this specification.

---

## **2. TXT Record Specification**

A provider **MUST** advertise its agent service by publishing a single DNS TXT record at `_agent.<domain>`.

### **2.1. Format**

The record's content **MUST** be a single string of semicolon-delimited `key=value` pairs. Clients **SHOULD** `trim()` leading/trailing whitespace from both keys and values when parsing, and **MUST** silently ignore unknown keys so future extensions are forward-compatible. If a DNS server splits the record into multiple 255-octet strings, the AID Client **MUST** concatenate them into a single string before parsing. The total length of the record content **SHOULD** be kept under 255 bytes to ensure efficiency.

| Key     | Alias | Requirement  | Description                                                                                         | Example                           |
| ------- | ----- | ------------ | --------------------------------------------------------------------------------------------------- | --------------------------------- |
| `v`     |       | **Required** | The specification version. For this document, it **MUST** be `aid1`.                                | `v=aid1`                          |
| `uri`   |       | **Required** | An absolute `https://` URL for a remote agent, or a package URI for a local agent (see Appendix B). | `uri=https://api.example.com/mcp` |
| `proto` | `p`   | **Required** | The protocol token from Appendix B. `p` is a recognized lowercase alias for `proto`.                | `proto=mcp` or `p=local`          |
| `auth`  |       | Recommended  | An authentication hint token from Appendix A.                                                       | `auth=pat`                        |
| `desc`  |       | Optional     | A short, human-readable string (≤ 60 UTF-8 bytes) for display in client UIs.                        | `desc=Primary AI Gateway`         |

A record **MUST NOT** include both `proto` and its alias `p`.

### **2.2. Examples**

**Remote MCP Agent:**

```dns
_agent.example.com. 300 IN TXT "v=aid1;uri=https://api.example.com/mcp;p=mcp;auth=pat;desc=Example AI Tools"
```

**Local Agent via Docker:**

```dns
_agent.grafana.com. 300 IN TXT "v=aid1;uri=docker:grafana/mcp:latest;p=local;auth=pat;desc=Run Grafana agent locally"
```

### **2.3. Client Discovery Algorithm**

An AID Client, when given a `<domain>`, **MUST** perform the following steps:

1.  **Normalize Domain:** If the domain contains non-ASCII characters, convert it to its Punycode A-label representation ([RFC5890]).
2.  **DNS Lookup:** Query the `TXT` record for `_agent.<domain>`. If no record is found, discovery fails (see Table 1).
3.  **Parse and Validate:** Parse the record's `key=value` pairs. Key comparisons **MUST** be case-insensitive (e.g., `proto` is equivalent to `PROTO`). The record **MUST** be treated as invalid if it does not contain `v=aid1` and both a `uri` and a protocol (`proto` or `p`).
4.  **Return Result:** If validation succeeds, return the discovered details (`uri`, `proto`, `auth?`, `desc?`) to the application logic. If the client does not support the discovered protocol token, it **MUST** fail with the appropriate error code.

#### **Table 1: Standard Client Error Codes**

Client implementations **SHOULD** use these codes to report specific failure modes. See Appendix C for numeric constants.

| Code   | Name                    | Meaning                                                                                   |
| ------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `1000` | `ERR_NO_RECORD`         | No `_agent` TXT record was found for the domain.                                          |
| `1001` | `ERR_INVALID_TXT`       | A record was found but is malformed or missing required keys.                             |
| `1002` | `ERR_UNSUPPORTED_PROTO` | The record is valid, but the client does not support the specified protocol.              |
| `1003` | `ERR_SECURITY`          | Discovery failed due to a security policy (e.g., DNSSEC failure, local execution denied). |
| `1004` | `ERR_DNS_LOOKUP_FAILED` | The DNS query failed for a network-related reason.                                        |

### **2.4. Exposing Multiple Protocols (Non-Normative Guidance)**

The canonical location for discovery is the base record: `_agent.<domain>`. Providers **MAY** additionally expose distinct agent services (e.g., one for MCP and one for A2A) on protocol-specific subdomains using the underscore form `_agent._<proto>.<domain>`.

**Examples:**

```dns
_agent._mcp.example.com. 300 IN TXT "v=aid1;p=mcp;uri=..."
_agent._a2a.example.com. 300 IN TXT "v=aid1;p=a2a;uri=..."
```

**Client behavior:**

- By default, clients query the base `_agent.<domain>`.
- When a specific protocol is explicitly requested (by the application), clients **MAY** first query the protocol-specific subdomain `_agent._<proto>.<domain>` and, if not found, fall back to the base record.
- Providers that publish only the base record remain fully compliant.

---

## **3. Security Rules**

- **DNSSEC:** Providers are **STRONGLY ENCOURAGED** to sign their DNS records with DNSSEC. Vercel-registered apex domains (including `agentcommunity.org`) are DNSSEC-signed by default. Clients **SHOULD** validate the `RRSIG` when the zone advertises it for the `_agent` record.
- **HTTPS:** A `remote` agent's `uri` **MUST** use `https://`. Clients **MUST** perform standard TLS certificate and hostname validation.
- **No Secrets:** The TXT record is public and **MUST NOT** contain any secrets.
- **Local Execution (`proto=local`) Safeguards:** Clients that support local execution **MUST** implement the following:
  1.  **Explicit Consent:** Before the first execution, the client **MUST** display the full, resolved command to the user and require explicit confirmation.
  2.  **Integrity Check:** The client **MUST** compute and cache a cryptographic fingerprint of the `uri` and `proto` values. If these values change on a subsequent lookup, the client **MUST** re-trigger the full consent process.
  3.  **No Shell Interpretation:** Arguments derived from the `uri` **MUST** be passed atomically to the underlying OS execution call to prevent command injection.
  4.  **No Nested Discovery:** Clients **MUST** reject a `local` execution `uri` that could be interpreted as a command initiating another AID discovery request.
  5.  **Sandboxing:** Clients **SHOULD** run local agents within a sandboxed environment with minimum necessary permissions.
- **Redirect Handling:** If an initial request to the discovered `uri` returns an HTTP redirect (`301`, `302`, `307`, or `308`) **to a different origin** (hostname or port), the client **SHOULD** treat this as a potential security risk. Clients **MUST NOT** follow such cross-origin redirects automatically. Implementations MAY either  
  a. terminate with `ERR_SECURITY`, or  
  b. require explicit user confirmation before proceeding.

---

## **4. DNS and Caching**

- **Provider TTL:** It is **RECOMMENDED** that providers set a Time-To-Live (TTL) of **300–900 seconds (5–15 minutes)** on their `_agent.<domain>` TXT record.
- **Client Caching:** Clients **MUST** respect the TTL of the DNS record they receive and **MUST NOT** cache the record for longer.

---

## **5. Future Path**

- **SRV/HTTPS Record Upgrade:** AID v2 is planned to use `SRV` records ([RFC2782]) for a more structured discovery mechanism. The service name will be `_agent._tcp`. Until ratified, TXT lookup remains the canonical method for v1.
- **IANA Registration:** A formal request for the `_agent` service name will be submitted to IANA as per [RFC6335].

---

## **6. Registries and Governance**

To ensure interoperability, token registries and community resources are maintained publicly.

- **Token Registries:** The canonical lists for `auth` and `proto` tokens are maintained at:
  [https://github.com/agentcommunity/aid-tokens](https://github.com/agentcommunity/aid-tokens)
  Additions require a pull request and are governed by a "First Come, First Served" policy with expert review.
- **Global Index:** An open DNS crawler and community dashboard showcasing AID adoption is maintained at:
  [https://github.com/agentcommunity/aid-registry](https://github.com/agentcommunity/aid-registry)

---

## **Appendix A: Authentication Scheme Registry (`auth`)**

_All scheme tokens are case-sensitive and defined in lowercase ASCII._

- `none`
- `pat` (Personal Access Token)
- `apikey`
- `basic` (HTTP Basic Authentication)
- `oauth2_device`
- `oauth2_code`
- `mtls`
- `custom`

## **Appendix B: Protocol Registry (`proto` / `p`)**

_All protocol tokens are case-sensitive and defined in lowercase ASCII._

| Token     | Meaning                                         | Allowed `uri` scheme(s)   |
| --------- | ----------------------------------------------- | ------------------------- |
| `mcp`     | Model Context Protocol                          | `https://`                |
| `a2a`     | Agent-to-Agent Protocol                         | `https://`                |
| `openapi` | URI points to an OpenAPI specification document | `https://`                |
| `local`   | The agent runs locally on the client machine    | `docker:`, `npx:`, `pip:` |

## **Appendix C: Client Error Constants**

For cross-language SDK consistency, clients **SHOULD** use these numeric constants when throwing errors.

| Constant                | Value  |
| ----------------------- | ------ |
| `ERR_NO_RECORD`         | `1000` |
| `ERR_INVALID_TXT`       | `1001` |
| `ERR_UNSUPPORTED_PROTO` | `1002` |
| `ERR_SECURITY`          | `1003` |
| `ERR_DNS_LOOKUP_FAILED` | `1004` |

## **References**

- [RFC1035] Domain Names - Implementation and Specification
- [RFC2119] Key words for use in RFCs to Indicate Requirement Levels
- [RFC2782] A DNS RR for specifying the location of services (DNS SRV)
- [RFC5890] Internationalized Domain Names for Applications (IDNA)
- [RFC8174] Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words
- [RFC9460] Service Binding and Parameter Specification (SVCB/HTTPS)

---

**Next Steps:**

- [Quick Start Guide](quickstart/index.md)
- [Blog: The Missing MX Record](blog/missing_record.md)
