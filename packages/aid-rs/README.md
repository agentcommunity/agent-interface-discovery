# aid-rs

Rust crate for Agent Interface Discovery (AID) parsing and generated constants.

- Parser only; no DNS discovery.
- No external dependencies.

## Install

```toml
[dependencies]
aid-rs = { path = "../aid-rs" }
```

## Usage

```rust
use aid_rs::parse;

fn main() -> Result<(), aid_rs::AidError> {
    let rec = parse("v=aid1;uri=https://api.example.com/mcp;p=mcp")?;
    assert_eq!(rec.proto, "mcp");
    Ok(())
}
```

## Errors

See `packages/docs/specification.md` for standard error codes (1000–1004).

## Development

```bash
pnpm gen
cd packages/aid-rs
cargo build
cargo test
```