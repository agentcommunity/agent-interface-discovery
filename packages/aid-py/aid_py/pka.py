"""PKA handshake (Python) for AID v1.1

Performs an HTTP Message Signatures (RFC 9421) verification using Ed25519 when
the TXT record includes a Public Key for Agent (pka) and key id (kid).
"""
from __future__ import annotations

import base64
import os
import re
import time
import hmac # Added for constant-time comparisons
from urllib.parse import urlparse
import urllib.request
import urllib.error

from .parser import AidError
import pathlib
import logging # Added for logging in empty except block

def _debug_write(name: str, data: str) -> None:
    try:
        d = pathlib.Path(__file__).resolve().parent / "_debug"
        d.mkdir(exist_ok=True)
        (d / name).write_text(data)
    except Exception as e:
        # Intentionally swallowing error here for debug writing,
        # as failure to write debug data should not stop the main flow.
        # Log for visibility in debug builds.
        logging.debug(f"Failed to write debug data: {e}")


def _b58_decode(s: str) -> bytes:
    alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    if not s:
        return b""
    zeros = 0
    while zeros < len(s) and s[zeros] == "1":
        zeros += 1
    # approximate size
    size = int(((len(s) - zeros) * (58).bit_length() / 8) + 1)
    b = [0] * size
    for ch in s[zeros:]:
        try:
            val = alphabet.index(ch)
        except ValueError:
            raise AidError("ERR_SECURITY", "Invalid base58 character") from None
        carry = val
        for j in range(size - 1, -1, -1):
            carry += 58 * b[j]
            b[j] = carry & 0xFF
            carry >>= 8
    # strip leading zeros in b
    it = 0
    while it < len(b) and b[it] == 0:
        it += 1
    out = bytes([0] * zeros + b[it:])
    return out


def _multibase_decode(s: str) -> bytes:
    if not s:
        raise AidError("ERR_SECURITY", "Empty PKA")
    prefix, payload = s[0], s[1:]
    if prefix == "z":
        return _b58_decode(payload)
    raise AidError("ERR_SECURITY", "Unsupported multibase prefix")


def _parse_signature_headers(headers: dict[str, str]) -> tuple[list[str], int, str, str, str, bytes, str | None]:
    sig_input = headers.get("Signature-Input") or headers.get("signature-input")
    sig = headers.get("Signature") or headers.get("signature")
    if not sig_input or not sig:
        raise AidError("ERR_SECURITY", "Missing signature headers")

    inside = re.search(r"sig=\(\s*([^)]*?)\s*\)", sig_input, flags=re.I)
    if not inside:
        raise AidError("ERR_SECURITY", "Invalid Signature-Input")
    covered: list[str] = re.findall(r'"([^"]+)"', inside.group(1))
    if not covered:
        raise AidError("ERR_SECURITY", "Invalid Signature-Input")
    required = {"aid-challenge", "@method", "@target-uri", "host", "date"}
    lowers = {c.lower() for c in covered}
    if lowers != required:
        raise AidError("ERR_SECURITY", "Signature-Input must cover required fields")

    cm = re.search(r"(?:^|;)\s*created=(\d+)", sig_input, flags=re.I)
    km = re.search(r"(?:^|;)\s*keyid=([^;\s]+)", sig_input, flags=re.I)
    am = re.search(r"(?:^|;)\s*alg=\"([^\"]+)\"", sig_input, flags=re.I)
    if not cm or not km or not am:
        raise AidError("ERR_SECURITY", "Invalid Signature-Input")
    created = int(cm.group(1))
    keyid_raw = km.group(1)
    keyid = keyid_raw.strip('"')
    alg = am.group(1).lower()

    sm = re.search(r"sig\s*=\s*:\s*([^:]+)\s*:", sig, flags=re.I)
    if not sm:
        raise AidError("ERR_SECURITY", "Invalid Signature header")
    signature = base64.b64decode(sm.group(1))
    date_header = headers.get("Date") or headers.get("date")
    return covered, created, keyid, keyid_raw, alg, signature, date_header


def _build_signature_base(
    covered: list[str],
    *,
    created: int,
    keyid: str,
    alg: str,
    method: str,
    target_uri: str,
    host: str,
    date: str,
    challenge: str,
) -> bytes:
    lines: list[str] = []
    for item in covered:
        lower = item.lower()
        if lower == "aid-challenge":
            lines.append(f'"AID-Challenge": {challenge}')
        elif lower == "@method":
            lines.append(f'"@method": {method}')
        elif lower == "@target-uri":
            lines.append(f'"@target-uri": {target_uri}')
        elif lower == "host":
            lines.append(f'"host": {host}')
        elif lower == "date":
            lines.append(f'"date": {date}')
        else:
            raise AidError("ERR_SECURITY", f"Unsupported covered field: {item}")
    quoted = " ".join(f'"{c}"' for c in covered)
    params = f"({quoted});created={created};keyid={keyid};alg=\"{alg}\""
    lines.append(f'"@signature-params": {params}')
    return "\n".join(lines).encode("utf-8")


def perform_pka_handshake(uri: str, pka: str, kid: str, *, timeout: float = 2.0) -> None:
    if not kid:
        raise AidError("ERR_SECURITY", "Missing kid for PKA")
    parsed = urlparse(uri)
    if not parsed.scheme or not parsed.netloc:
        raise AidError("ERR_SECURITY", "Invalid URI for handshake")

    # Prepare request
    nonce = os.urandom(32)
    challenge = base64.urlsafe_b64encode(nonce).decode("ascii").rstrip("=")
    date_hdr = time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.gmtime())
    req = urllib.request.Request(uri, headers={"AID-Challenge": challenge, "Date": date_hdr})

    try:
        opener = urllib.request.build_opener()
        with opener.open(req, timeout=timeout) as resp:  # nosec B310
            if resp.status != 200:
                raise AidError("ERR_SECURITY", f"Handshake HTTP {resp.status}")
            headers = {k: v for k, v in resp.headers.items()}
    except AidError:
        raise
    except Exception as exc:  # pragma: no cover - network errors
        raise AidError("ERR_SECURITY", str(exc)) from None

    covered, created, keyid, keyid_raw, alg, signature, date_header = _parse_signature_headers(headers)
    now = int(time.time())
    if abs(now - created) > 300:
        raise AidError("ERR_SECURITY", "Signature created timestamp outside acceptance window")
    if date_header:
        try:
            from email.utils import parsedate_to_datetime  # stdlib

            dt = parsedate_to_datetime(date_header)
            epoch = int(dt.timestamp())
        except ValueError as e:
            logging.exception(f"Failed to parse Date header: {e}")
            raise AidError("ERR_SECURITY", "Invalid Date header") from None
        if abs(now - epoch) > 300:
            raise AidError("ERR_SECURITY", "HTTP Date header outside acceptance window")
    if not hmac.compare_digest(keyid.encode('utf-8'), kid.encode('utf-8')):
        raise AidError("ERR_SECURITY", "Signature keyid mismatch")
    if not hmac.compare_digest(alg.encode('utf-8'), b"ed25519"):
        raise AidError("ERR_SECURITY", "Unsupported signature algorithm")

    host = parsed.netloc
    base = _build_signature_base(
        covered,
        created=created,
        keyid=keyid_raw,
        alg=alg,
        method="GET",
        target_uri=uri,
        host=host,
        date=date_header or date_hdr,
        challenge=challenge,
    )
    if os.environ.get("AID_DEBUG_PKA") == "1":
        _debug_write("base_runtime.txt", base.decode("utf-8", errors="ignore"))

    pub = _multibase_decode(pka)
    if len(pub) != 32:
        raise AidError("ERR_SECURITY", "Invalid PKA length")

    try:
        # Prefer PyNaCl if available
        try:
            from nacl.signing import VerifyKey  # type: ignore

            vk = VerifyKey(pub)
            vk.verify(base, signature)  # raises on failure
            return
        except ImportError as e:
            logging.debug(f"PyNaCl not available, falling back to cryptography: {e}")
            # Fallback to cryptography if available
            from cryptography.hazmat.primitives.asymmetric import ed25519  # type: ignore
            from cryptography.exceptions import InvalidSignature  # type: ignore

            vk = ed25519.Ed25519PublicKey.from_public_bytes(pub)
            try:
                vk.verify(signature, base)
            except InvalidSignature:
                raise AidError("ERR_SECURITY", "PKA signature verification failed") from None
    except AidError:
        raise
    except Exception as exc:  # pragma: no cover - missing libs
        raise AidError("ERR_SECURITY", f"PKA verification unavailable: {exc}") from None
