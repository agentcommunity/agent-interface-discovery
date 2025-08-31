# aid-rs

Rust crate for Agent Interface Discovery (AID) parsing and generated constants.

- Parser by default; optional PKA handshake behind a feature flag.
- No runtime dependencies for the parser; handshake uses `reqwest`, `ed25519-dalek`, `bs58`, `httpdate`.

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

### v1.1 (PKA) – optional handshake

Enable the `handshake` feature to verify endpoint control when a record includes `pka`/`kid`.

```toml
[dependencies]
aid-rs = { path = "../aid-rs", features = ["handshake"] }
```

```rust
#[cfg(feature = "handshake")]
use aid_rs::perform_pka_handshake;

#[cfg(feature = "handshake")]
#[tokio::main]
async fn main() -> Result<(), aid_rs::AidError> {
    let rec = aid_rs::parse("v=aid1;uri=https://api.example.com/mcp;p=mcp;k=zBase58;i=g1")?;
    perform_pka_handshake(&rec.uri, rec.pka.as_deref().unwrap(), rec.kid.as_deref().unwrap(), std::time::Duration::from_secs(2)).await?;
    Ok(())
}
```

## Errors

See `packages/docs/specification.md` for standard error codes (1000–1005).

## Development

```bash
pnpm gen
cd packages/aid-rs
cargo build
cargo test
# With handshake feature
cargo test --features handshake
```
