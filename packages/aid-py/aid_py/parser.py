"""AID record parser and validator (Python).

Mirrors the TypeScript reference implementation in `packages/aid/src/parser.ts`.
"""
from __future__ import annotations

import re
from typing import Dict, Tuple, TypedDict

from .constants import (
    SPEC_VERSION,
    PROTOCOL_TOKENS,
    AUTH_TOKENS,
    ERROR_MESSAGES,
    ERROR_CODES,
    LOCAL_URI_SCHEMES,
)

# ---------------------------------------------------------------------------
# Error class
# ---------------------------------------------------------------------------


class AidError(ValueError):
    """Raised when parsing/validation fails with spec-specific error codes."""

    def __init__(self, error_code: str, message: str | None = None):
        if error_code not in ERROR_CODES:
            raise ValueError(f"Unknown error code: {error_code}")
        super().__init__(message or ERROR_MESSAGES[error_code])
        self.name = "AidError"
        self.error_code: str = error_code  # symbolic (e.g. "ERR_INVALID_TXT")
        self.code: int = ERROR_CODES[error_code]  # numeric (e.g. 1001)

    def __repr__(self) -> str:  # pragma: no cover
        return f"AidError(error_code={self.error_code}, message={self.args[0]!r})"


# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------


class AidRecord(TypedDict, total=False):
    v: str
    uri: str
    proto: str
    auth: str
    desc: str


RawAidRecord = Dict[str, str]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _parse_raw_record(txt: str) -> RawAidRecord:
    """Split semicolon-delimited key=value pairs into a dict."""

    record: RawAidRecord = {}

    # Drop surrounding whitespace and split by semicolon
    for pair in [p.strip() for p in txt.split(";") if p.strip()]:
        if "=" not in pair:
            raise AidError("ERR_INVALID_TXT", f"Invalid key-value pair: {pair}")
        key, value = pair.split("=", 1)
        key = key.strip().lower()
        value = value.strip()
        if not key or not value:
            raise AidError("ERR_INVALID_TXT", f"Empty key or value in pair: {pair}")
        if key in record:
            raise AidError("ERR_INVALID_TXT", f"Duplicate key: {key}")
        record[key] = value
    return record


def _is_valid_local_uri(uri: str) -> bool:
    match = re.match(r"^(?P<scheme>[a-zA-Z][a-zA-Z0-9+.-]*):", uri)
    if not match:
        return False
    scheme = match.group("scheme")
    return scheme in LOCAL_URI_SCHEMES


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def validate_record(raw: RawAidRecord) -> AidRecord:
    """Validate a raw record dict and return a typed record."""

    # Required fields
    if "v" not in raw:
        raise AidError("ERR_INVALID_TXT", "Missing required field: v")
    if "uri" not in raw:
        raise AidError("ERR_INVALID_TXT", "Missing required field: uri")

    # proto or p but not both
    has_proto = "proto" in raw
    has_p = "p" in raw
    if has_proto and has_p:
        raise AidError("ERR_INVALID_TXT", 'Cannot specify both "proto" and "p" fields')
    if not has_proto and not has_p:
        raise AidError("ERR_INVALID_TXT", "Missing required field: proto (or p)")

    # Version check
    if raw["v"] != SPEC_VERSION:
        raise AidError(
            "ERR_INVALID_TXT",
            f"Unsupported version: {raw['v']}. Expected: {SPEC_VERSION}",
        )

    proto_value = raw.get("proto") or raw.get("p")  # already ensured exists
    if proto_value not in PROTOCOL_TOKENS:
        raise AidError("ERR_UNSUPPORTED_PROTO", f"Unsupported protocol: {proto_value}")

    # Auth token validation
    if "auth" in raw and raw["auth"] not in AUTH_TOKENS:
        raise AidError("ERR_INVALID_TXT", f"Invalid auth token: {raw['auth']}")

    # Description length ≤ 60 UTF-8 bytes
    if "desc" in raw and len(raw["desc"].encode("utf-8")) > 60:
        raise AidError("ERR_INVALID_TXT", "Description field must be ≤ 60 UTF-8 bytes")

    # URI validation
    uri = raw["uri"]
    if proto_value == "local":
        # Must use approved local scheme
        if not _is_valid_local_uri(uri):
            raise AidError(
                "ERR_INVALID_TXT",
                f"Invalid URI scheme for local protocol. Must be one of: {', '.join(LOCAL_URI_SCHEMES)}",
            )
    else:
        if not uri.startswith("https://"):
            raise AidError(
                "ERR_INVALID_TXT",
                f"Invalid URI scheme for remote protocol '{proto_value}'. MUST be 'https:'",
            )
        # Basic URL validation
        try:
            from urllib.parse import urlparse

            parsed = urlparse(uri)
            if not parsed.scheme or not parsed.netloc:
                raise ValueError
        except Exception:
            raise AidError("ERR_INVALID_TXT", f"Invalid URI format: {uri}") from None

    # Build typed record
    record: AidRecord = {
        "v": "aid1",
        "uri": uri,
        "proto": proto_value,  # type: ignore[assignment]
    }
    if "auth" in raw:
        record["auth"] = raw["auth"]
    if "desc" in raw:
        record["desc"] = raw["desc"]
    return record


def parse(txt_record: str) -> AidRecord:
    """Parse and validate a TXT record string."""

    raw = _parse_raw_record(txt_record)
    return validate_record(raw)


def is_valid_proto(token: str) -> bool:
    return token in PROTOCOL_TOKENS


# Expose main helpers for import convenience
__all__ = [
    "AidError",
    "parse",
    "validate_record",
    "is_valid_proto",
] 