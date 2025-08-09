// GENERATED FILE - DO NOT EDIT

// Auto-generated from protocol/constants.yml by scripts/generate-constants.ts
// Run 'pnpm gen' to regenerate.

pub const SPEC_VERSION: &str = "aid1";

// Protocol tokens
pub const PROTO_A2A: &str = "a2a";
pub const PROTO_LOCAL: &str = "local";
pub const PROTO_MCP: &str = "mcp";
pub const PROTO_OPENAPI: &str = "openapi";

// Auth tokens
pub const AUTH_APIKEY: &str = "apikey";
pub const AUTH_BASIC: &str = "basic";
pub const AUTH_CUSTOM: &str = "custom";
pub const AUTH_MTLS: &str = "mtls";
pub const AUTH_NONE: &str = "none";
pub const AUTH_OAUTH2_CODE: &str = "oauth2_code";
pub const AUTH_OAUTH2_DEVICE: &str = "oauth2_device";
pub const AUTH_PAT: &str = "pat";

// Error codes
pub const ERR_DNS_LOOKUP_FAILED: u16 = 1004;
pub const ERR_INVALID_TXT: u16 = 1001;
pub const ERR_NO_RECORD: u16 = 1000;
pub const ERR_SECURITY: u16 = 1003;
pub const ERR_UNSUPPORTED_PROTO: u16 = 1002;

pub const DNS_SUBDOMAIN: &str = "_agent";
pub const DNS_TTL_MIN: u32 = 300;
pub const DNS_TTL_MAX: u32 = 900;

pub const LOCAL_URI_SCHEMES: &[&str] = &["docker", "npx", "pip"];
