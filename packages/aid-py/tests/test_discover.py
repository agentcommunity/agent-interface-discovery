import types, sys, pathlib
import pytest

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))

from aid_py import discover, AidError  # noqa: E402


class _FakeRdata:  # minimal stub
    def __init__(self, strings):
        self.strings = tuple(s.encode() for s in strings)


class _FakeAnswer(list):
    def __init__(self, strings_list, ttl):
        super().__init__(_FakeRdata([s]) for s in strings_list)
        rrset = types.SimpleNamespace()
        rrset.ttl = ttl
        self.rrset = rrset


@pytest.fixture()
def monkey_resolver(monkeypatch):
    import dns.resolver

    def _fake_resolve(name, rdtype, lifetime=5.0):
        assert rdtype == "TXT"
        if name == "_agent.example.com":
            return _FakeAnswer(["v=aid1;uri=https://api.example.com/mcp;proto=mcp"], 300)
        raise dns.resolver.NXDOMAIN()

    monkeypatch.setattr(dns.resolver, "resolve", _fake_resolve)


def test_discover_success(monkey_resolver):  # pylint: disable=unused-argument
    record, ttl = discover("example.com")
    assert record["proto"] == "mcp"
    assert ttl == 300


def test_discover_no_record(monkeypatch):
    import dns.resolver

    def _no_record(name, rdtype, lifetime=5.0):
        raise dns.resolver.NXDOMAIN()

    monkeypatch.setattr(dns.resolver, "resolve", _no_record)
    with pytest.raises(AidError):
        discover("missing.com") 