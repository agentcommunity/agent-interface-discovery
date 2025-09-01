# MIT License
# Shared PKA vectors parity tests (Python)

import sys, pathlib, json, base64, time
import pytest

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))

from aid_py import discover, AidError  # noqa: E402

cryptography = pytest.importorskip("cryptography")
from cryptography.hazmat.primitives.asymmetric import ed25519  # type: ignore # noqa: E402
from cryptography.hazmat.primitives import serialization  # type: ignore # noqa: E402


def _load_vectors():
    root = pathlib.Path(__file__).resolve().parents[3]
    data = json.loads((root / "protocol" / "pka_vectors.json").read_text())
    return data["vectors"]


ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


def _b58encode(b: bytes) -> str:
    n = int.from_bytes(b, "big")
    out = ""
    while n > 0:
        n, rem = divmod(n, 58)
        out = ALPHABET[rem] + out
    pad = 0
    for x in b:
        if x == 0:
            pad += 1
        else:
            break
    return "1" * pad + out


class _Resp:
    def __init__(self, status: int, headers: dict[str, str], body: str):
        self.status = status
        self.headers = headers
        self._b = body.encode()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self):
        return self._b


@pytest.mark.parametrize("vector", _load_vectors(), ids=lambda v: v["id"])  # type: ignore
def test_pka_vectors(monkeypatch, vector):
    import dns.resolver

    def _no_record(name, rdtype, lifetime=5.0):
        raise dns.resolver.NXDOMAIN()

    monkeypatch.setattr(dns.resolver, "resolve", _no_record)

    seed = base64.b64decode(vector["key"]["seed_b64"])  # 32 bytes
    priv = ed25519.Ed25519PrivateKey.from_private_bytes(seed)
    pub = priv.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    pka = "z" + _b58encode(pub)

    import urllib.request

    def _fake_open(req, timeout=2.0):
        url = req.full_url if hasattr(req, "full_url") else req
        if url.endswith("/.well-known/agent"):
            headers = {"Content-Type": "application/json"}
            body = json.dumps({
                "v": vector["record"]["v"],
                "u": vector["record"]["u"],
                "p": vector["record"]["p"],
                "k": pka,
                "i": vector["record"]["i"],
            })
            return _Resp(200, headers, body)
        order = vector["covered"]
        def _h(name: str):
            v = None
            try:
                v = req.headers.get(name) if hasattr(req, "headers") else None
            except Exception:
                v = None
            if not v and hasattr(req, "get_header"):
                try:
                    v = req.get_header(name)
                except Exception:
                    v = None
            if not v and hasattr(req, "headers") and isinstance(req.headers, dict):
                for k, val in req.headers.items():
                    if k.lower() == name.lower():
                        v = val
                        break
            return v
        challenge = _h("AID-Challenge")
        method = "GET"
        target = url
        from urllib.parse import urlparse

        host = urlparse(url).netloc
        # For pass cases, echo back the client's Date header; otherwise use the vector-provided httpDate
        date = _h("Date") if vector["expect"] == "pass" else (vector.get("httpDate") or _h("Date"))
        lines: list[str] = []
        for item in order:
            if item == "AID-Challenge":
                lines.append(f'"AID-Challenge": {challenge}')
            elif item == "@method":
                lines.append(f'"@method": {method}')
            elif item == "@target-uri":
                lines.append(f'"@target-uri": {target}')
            elif item == "host":
                lines.append(f'"host": {host}')
            elif item == "date":
                lines.append(f'"date": {date}')
        keyid = vector.get("overrideKeyId") or vector["record"]["i"]
        alg = vector.get("overrideAlg") or "ed25519"
        created = int(time.time()) if vector["expect"] == "pass" else vector["created"]
        quoted = ' '.join([f'"{c}"' for c in order])
        params = f"({quoted});created={created};keyid={keyid};alg=\"{alg}\""
        lines.append(f'"@signature-params": {params}')
        base = "\n".join(lines).encode("utf-8")
        sig = priv.sign(base)
        headers = {
            "Signature-Input": f"sig=({quoted});created={created};keyid={keyid};alg=\"{alg}\"",
            "Signature": f"sig=:{base64.b64encode(sig).decode()}:",
            "Date": date,
        }
        return _Resp(200, headers, "")

    class _FakeOpener:
        def open(self, req, timeout=2.0):
            return _fake_open(req, timeout)

    monkeypatch.setattr(urllib.request, "build_opener", lambda *args, **kwargs: _FakeOpener())

    if vector["expect"] == "pass":
        rec, _ = discover("example.com", well_known_fallback=True)
        assert rec["pka"].startswith("z")
    else:
        with pytest.raises(AidError):
            discover("example.com", well_known_fallback=True)
