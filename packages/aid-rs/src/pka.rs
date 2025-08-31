//! PKA handshake verification for Rust (feature = "handshake")
#![cfg(feature = "handshake")]

use crate::errors::AidError;
use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine as _;
use ed25519_dalek::{Signature, VerifyingKey};
use httpdate::parse_http_date;
use reqwest::header::HeaderMap;
use reqwest::Client;
use std::collections::HashSet;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

fn multibase_decode(input: &str) -> Result<Vec<u8>, AidError> {
    if input.is_empty() {
        return Err(AidError::new("ERR_SECURITY", "Empty PKA"));
    }
    let (prefix, rest) = input.split_at(1);
    match prefix {
        "z" => bs58::decode(rest)
            .into_vec()
            .map_err(|_| AidError::new("ERR_SECURITY", "Invalid base58")),
        _ => Err(AidError::new("ERR_SECURITY", "Unsupported multibase prefix")),
    }
}

fn parse_signature_headers(headers: &HeaderMap) -> Result<(Vec<String>, i64, String, String, Vec<u8>, Option<String>), AidError> {
    let sig_input = headers
        .get("Signature-Input")
        .or_else(|| headers.get("signature-input"))
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AidError::new("ERR_SECURITY", "Missing signature headers"))?;
    let sig = headers
        .get("Signature")
        .or_else(|| headers.get("signature"))
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AidError::new("ERR_SECURITY", "Missing signature headers"))?;

    // Extract covered fields inside parentheses after sig=(...)
    let inside_start = sig_input.find("sig=(").ok_or_else(|| AidError::new("ERR_SECURITY", "Invalid Signature-Input"))? + 5;
    let rest = &sig_input[inside_start..];
    let close = rest.find(')').ok_or_else(|| AidError::new("ERR_SECURITY", "Invalid Signature-Input"))?;
    let inside = &rest[..close];
    let mut covered = Vec::new();
    let mut s = inside;
    while let Some(i) = s.find('"') {
        s = &s[i + 1..];
        if let Some(j) = s.find('"') {
            covered.push(s[..j].to_string());
            s = &s[j + 1..];
        } else {
            break;
        }
    }
    if covered.is_empty() {
        return Err(AidError::new("ERR_SECURITY", "Invalid Signature-Input"));
    }
    let required: HashSet<&str> = ["aid-challenge", "@method", "@target-uri", "host", "date"].into_iter().collect();
    let lower: HashSet<String> = covered.iter().map(|c| c.to_lowercase()).collect();
    if lower.len() != required.len() || required.iter().any(|r| !lower.contains(&r.to_string())) {
        return Err(AidError::new("ERR_SECURITY", "Signature-Input must cover required fields"));
    }

    // Params
    let mut created: i64 = 0;
    let mut keyid = String::new();
    let mut alg = String::new();
    for part in sig_input.split(';') {
        let p = part.trim();
        let pl = p.to_lowercase();
        if pl.starts_with("created=") {
            if let Ok(c) = p[8..].parse::<i64>() {
                created = c;
            }
        } else if pl.starts_with("keyid=") {
            keyid = p[6..].trim().to_string();
        } else if pl.starts_with("alg=") {
            alg = p[4..].trim().trim_matches('"').to_lowercase();
        }
    }
    if created == 0 || keyid.is_empty() || alg.is_empty() {
        return Err(AidError::new("ERR_SECURITY", "Invalid Signature-Input"));
    }
    // Signature header: sig=:base64:
    let sig_pos = sig.to_lowercase().find("sig=").ok_or_else(|| AidError::new("ERR_SECURITY", "Invalid Signature header"))?;
    let val = &sig[sig_pos + 4..];
    let val = val.strip_prefix(':').ok_or_else(|| AidError::new("ERR_SECURITY", "Invalid Signature header"))?;
    let end = val.find(':').ok_or_else(|| AidError::new("ERR_SECURITY", "Invalid Signature header"))?;
    let b64 = &val[..end];
    let signature = B64.decode(b64).map_err(|_| AidError::new("ERR_SECURITY", "Invalid Signature header"))?;

    let response_date = headers
        .get("Date")
        .or_else(|| headers.get("date"))
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    Ok((covered, created, keyid, alg, signature, response_date))
}

fn build_signature_base(
    covered: &[String],
    created: i64,
    keyid: &str,
    alg: &str,
    method: &str,
    target_uri: &str,
    host: &str,
    date: &str,
    challenge: &str,
) -> Vec<u8> {
    let mut lines: Vec<String> = Vec::new();
    for item in covered {
        match item.to_lowercase().as_str() {
            "aid-challenge" => lines.push(format!("\"AID-Challenge\": {}", challenge)),
            "@method" => lines.push(format!("\"@method\": {}", method)),
            "@target-uri" => lines.push(format!("\"@target-uri\": {}", target_uri)),
            "host" => lines.push(format!("\"host\": {}", host)),
            "date" => lines.push(format!("\"date\": {}", date)),
            _ => return Vec::new(),
        }
    }
    let quoted = covered.iter().map(|c| format!("\"{}\"", c)).collect::<Vec<_>>().join(" ");
    let params = format!("({});created={};keyid={};alg=\"{}\"", quoted, created, keyid, alg);
    lines.push(format!("\"@signature-params\": {}", params));
    lines.join("\n").into_bytes()
}

pub async fn perform_pka_handshake(uri: &str, pka: &str, kid: &str, timeout: Duration) -> Result<(), AidError> {
    if kid.is_empty() {
        return Err(AidError::new("ERR_SECURITY", "Missing kid for PKA"));
    }
    let u = reqwest::Url::parse(uri).map_err(|_| AidError::new("ERR_SECURITY", "Invalid URI for handshake"))?;
    let host = u.host_str().ok_or_else(|| AidError::new("ERR_SECURITY", "Invalid URI for handshake"))?;
    let client = Client::builder().http2_prior_knowledge(false).timeout(timeout).build().map_err(|e| AidError::new("ERR_SECURITY", e.to_string()))?;

    // 32-byte random challenge; here we use system time jitter for simplicity; production should use rng
    // but reqwest + std provides no RNG-free API; however challenge is not secret
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos().to_le_bytes();
    let challenge = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(&nonce);
    let date = httpdate::fmt_http_date(SystemTime::now());

    let res = client
        .get(u.clone())
        .header("AID-Challenge", &challenge)
        .header("Date", &date)
        .send()
        .await
        .map_err(|e| AidError::new("ERR_SECURITY", e.to_string()))?;
    if !res.status().is_success() {
        return Err(AidError::new("ERR_SECURITY", format!("Handshake HTTP {}", res.status())));
    }
    let headers = res.headers().clone();
    let (covered, created, mut keyid, alg, signature, response_date) = parse_signature_headers(&headers)?;
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as i64;
    if (now - created).abs() > 300 {
        return Err(AidError::new("ERR_SECURITY", "Signature created timestamp outside acceptance window"));
    }
    if let Some(date_hdr) = response_date {
        if let Ok(dt) = parse_http_date(&date_hdr) {
            let epoch = dt.duration_since(UNIX_EPOCH).unwrap().as_secs() as i64;
            if (now - epoch).abs() > 300 {
                return Err(AidError::new("ERR_SECURITY", "HTTP Date header outside acceptance window"));
            }
        } else {
            return Err(AidError::new("ERR_SECURITY", "Invalid Date header"));
        }
    }
    if keyid.len() >= 2 && keyid.starts_with('"') && keyid.ends_with('"') {
        keyid = keyid.trim_matches('"').to_string();
    }
    if keyid != kid {
        return Err(AidError::new("ERR_SECURITY", "Signature keyid mismatch"));
    }
    if alg.to_lowercase() != "ed25519" {
        return Err(AidError::new("ERR_SECURITY", "Unsupported signature algorithm"));
    }

    let base = build_signature_base(
        &covered,
        created,
        &keyid,
        &alg,
        "GET",
        uri,
        host,
        response_date.as_deref().unwrap_or(&date),
        &challenge,
    );

    let pubkey = multibase_decode(pka)?;
    if pubkey.len() != 32 {
        return Err(AidError::new("ERR_SECURITY", "Invalid PKA length"));
    }
    let vk = VerifyingKey::from_bytes(pubkey.as_slice().try_into().unwrap())
        .map_err(|_| AidError::new("ERR_SECURITY", "Invalid public key"))?;
    let sig = Signature::from_slice(&signature).map_err(|_| AidError::new("ERR_SECURITY", "Invalid signature"))?;
    vk.verify(&base, &sig)
        .map_err(|_| AidError::new("ERR_SECURITY", "PKA signature verification failed"))?;
    Ok(())
}

