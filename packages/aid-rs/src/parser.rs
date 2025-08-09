use std::collections::HashSet;

use crate::constants_gen::{
    AUTH_APIKEY, AUTH_BASIC, AUTH_CUSTOM, AUTH_MTLS, AUTH_NONE, AUTH_OAUTH2_CODE, AUTH_OAUTH2_DEVICE,
    PROTO_A2A, PROTO_LOCAL, PROTO_MCP, PROTO_OPENAPI, SPEC_VERSION, AUTH_PAT,
};
use crate::errors::AidError;
use crate::record::AidRecord;

fn is_supported_proto(token: &str) -> bool {
    matches!(token, PROTO_MCP | PROTO_A2A | PROTO_OPENAPI | PROTO_LOCAL)
}

fn is_supported_auth(token: &str) -> bool {
    matches!(
        token,
        AUTH_NONE | AUTH_PAT | AUTH_APIKEY | AUTH_BASIC | AUTH_OAUTH2_DEVICE | AUTH_OAUTH2_CODE | AUTH_MTLS | AUTH_CUSTOM
    )
}

pub fn parse(txt: &str) -> Result<AidRecord, AidError> {
    let mut v: Option<String> = None;
    let mut uri: Option<String> = None;
    let mut proto: Option<String> = None;
    let mut p: Option<String> = None;
    let mut auth: Option<String> = None;
    let mut desc: Option<String> = None;

    let mut seen: HashSet<String> = HashSet::new();

    for raw_pair in txt.split(';') {
        let pair = raw_pair.trim();
        if pair.is_empty() { continue; }
        let mut iter = pair.splitn(2, '=');
        let key_raw = iter.next().ok_or_else(|| AidError::invalid_txt("Invalid key-value pair"))?;
        let value_raw = iter.next().ok_or_else(|| AidError::invalid_txt(format!("Invalid key-value pair: {}", pair)))?;
        let key = key_raw.trim().to_lowercase();
        let value = value_raw.trim().to_string();
        if key.is_empty() || value.is_empty() {
            return Err(AidError::invalid_txt(format!("Empty key or value in pair: {}", pair)));
        }
        match key.as_str() {
            "v" | "uri" | "proto" | "p" | "auth" | "desc" => {
                if seen.contains(&key) { return Err(AidError::invalid_txt(format!("Duplicate key: {}", key))); }
                seen.insert(key.clone());
            }
            _ => {}
        }
        match key.as_str() {
            "v" => v = Some(value),
            "uri" => uri = Some(value),
            "proto" => proto = Some(value),
            "p" => p = Some(value),
            "auth" => auth = Some(value),
            "desc" => desc = Some(value),
            _ => {}
        }
    }

    let v = v.ok_or_else(|| AidError::invalid_txt("Missing required field: v"))?;
    if v != SPEC_VERSION {
        return Err(AidError::invalid_txt(format!("Unsupported version: {}. Expected: {}", v, SPEC_VERSION)));
    }

    let uri = uri.ok_or_else(|| AidError::invalid_txt("Missing required field: uri"))?;

    if proto.is_some() && p.is_some() { return Err(AidError::invalid_txt("Cannot specify both \"proto\" and \"p\" fields")); }
    if proto.is_none() && p.is_none() { return Err(AidError::invalid_txt("Missing required field: proto (or p)")); }

    let proto_value = proto.or(p).unwrap();

    if !is_supported_proto(&proto_value) { return Err(AidError::unsupported_proto(format!("Unsupported protocol: {}", proto_value))); }

    if let Some(ref auth_val) = auth {
        if !is_supported_auth(auth_val.as_str()) {
            return Err(AidError::invalid_txt(format!("Invalid auth token: {}", auth_val)));
        }
    }

    if let Some(ref d) = desc {
        if d.as_bytes().len() > 60 {
            return Err(AidError::invalid_txt("Description field must be ≤ 60 UTF-8 bytes"));
        }
    }

    Ok(AidRecord { v, uri, proto: proto_value, auth, desc })
}