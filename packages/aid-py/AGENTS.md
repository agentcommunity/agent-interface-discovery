# AGENTS.md

## Build and test
```bash
# Python
python3 -m pip install -e '.[dev]'
pytest -q
```

## Parity

* Ensure fixtures align with TS parity suite
* Run from repo root: `pnpm test:parity`

## Notes

* Mirror record shapes from generated types
* Follow TTL bounds and TXT serialization rules from spec
