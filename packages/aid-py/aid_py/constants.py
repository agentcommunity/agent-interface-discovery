"""AID specification constants for the Python implementation.

NOTE: These values are duplicated from the single-source YAML (`protocol/constants.yml`).
During Phase 2 we may replace this static file with code-generation from the YAML,
but for now we keep it simple so we can progress with the parser logic.
"""
from __future__ import annotations

from typing import Final, Dict, List

# ---------------------------------------------------------------------------
# Version
# ---------------------------------------------------------------------------

SPEC_VERSION: Final[str] = "aid1"

# ---------------------------------------------------------------------------
# Protocol tokens
# ---------------------------------------------------------------------------

PROTO_A2A: Final[str] = "a2a"
PROTO_LOCAL: Final[str] = "local"
PROTO_MCP: Final[str] = "mcp"
PROTO_OPENAPI: Final[str] = "openapi"

PROTOCOL_TOKENS: Final[Dict[str, str]] = {
    "a2a": PROTO_A2A,
    "local": PROTO_LOCAL,
    "mcp": PROTO_MCP,
    "openapi": PROTO_OPENAPI,
}

# ---------------------------------------------------------------------------
# Auth tokens
# ---------------------------------------------------------------------------

AUTH_APIKEY: Final[str] = "apikey"
AUTH_BASIC: Final[str] = "basic"
AUTH_CUSTOM: Final[str] = "custom"
AUTH_MTLS: Final[str] = "mtls"
AUTH_NONE: Final[str] = "none"
AUTH_OAUTH2_CODE: Final[str] = "oauth2_code"
AUTH_OAUTH2_DEVICE: Final[str] = "oauth2_device"
AUTH_PAT: Final[str] = "pat"

AUTH_TOKENS: Final[Dict[str, str]] = {
    "apikey": AUTH_APIKEY,
    "basic": AUTH_BASIC,
    "custom": AUTH_CUSTOM,
    "mtls": AUTH_MTLS,
    "none": AUTH_NONE,
    "oauth2_code": AUTH_OAUTH2_CODE,
    "oauth2_device": AUTH_OAUTH2_DEVICE,
    "pat": AUTH_PAT,
}

# ---------------------------------------------------------------------------
# Error codes & messages
# ---------------------------------------------------------------------------

ERR_DNS_LOOKUP_FAILED: Final[int] = 1004
ERR_INVALID_TXT: Final[int] = 1001
ERR_NO_RECORD: Final[int] = 1000
ERR_SECURITY: Final[int] = 1003
ERR_UNSUPPORTED_PROTO: Final[int] = 1002

ERROR_CODES: Final[Dict[str, int]] = {
    "ERR_DNS_LOOKUP_FAILED": ERR_DNS_LOOKUP_FAILED,
    "ERR_INVALID_TXT": ERR_INVALID_TXT,
    "ERR_NO_RECORD": ERR_NO_RECORD,
    "ERR_SECURITY": ERR_SECURITY,
    "ERR_UNSUPPORTED_PROTO": ERR_UNSUPPORTED_PROTO,
}

ERROR_MESSAGES: Final[Dict[str, str]] = {
    "ERR_DNS_LOOKUP_FAILED": "The DNS query failed for a network-related reason",
    "ERR_INVALID_TXT": "A record was found but is malformed or missing required keys",
    "ERR_NO_RECORD": "No _agent TXT record was found for the domain",
    "ERR_SECURITY": "Discovery failed due to a security policy (e.g., DNSSEC failure, local execution denied)",
    "ERR_UNSUPPORTED_PROTO": "The record is valid, but the client does not support the specified protocol",
}

# ---------------------------------------------------------------------------
# Other spec constants
# ---------------------------------------------------------------------------

DNS_SUBDOMAIN: Final[str] = "_agent"
DNS_TTL_MIN: Final[int] = 300
DNS_TTL_MAX: Final[int] = 900

LOCAL_URI_SCHEMES: Final[List[str]] = ["docker", "npx", "pip"] 