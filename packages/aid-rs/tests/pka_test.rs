#![cfg(feature = "handshake")]

use aid_rs::perform_pka_handshake;
use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use ed25519_dalek::{Signer, SigningKey, VerifyingKey};
use httpmock::MockServer;
use std::time::Duration;

fn b58_z(bytes: &[u8]) -> String {
    format!("z{}", bs58::encode(bytes).into_string())
}

fn build_base(order: &[&str], challenge: &str, method: &str, target: &str, host: &str, date: &str, created: i64, kid: &str, alg: &str) -> (String, Vec<u8>) {
    let mut lines = Vec::new();
    for item in order {
        match *item {
            "AID-Challenge" => lines.push(format!("\"AID-Challenge\": {}", challenge)),
            "@method" => lines.push(format!("\"@method\": {}", method)),
            "@target-uri" => lines.push(format!("\"@target-uri\": {}", target)),
            "host" => lines.push(format!("\"host\": {}", host)),
            "date" => lines.push(format!("\"date\": {}", date)),
            _ => {}
        }
    }
    let quoted = order.iter().map(|c| format!("\"{}\"", c)).collect::<Vec<_>>().join(" ");
    let params = format!("({});created={};keyid={};alg=\"{}\"", quoted, created, kid, alg);
    lines.push(format!("\"@signature-params\": {}", params));
    (params, lines.join("\n").into_bytes())
}

#[test]
fn rust_pka_valid_and_kid_mismatch() {
    let server = MockServer::start();
    let seed = [0u8; 32];
    let sk = SigningKey::from_bytes(&seed);
    let vk = VerifyingKey::from(&sk);
    let pka = b58_z(vk.as_bytes());
    let kid = "g1";
    let created: i64 = 1735689600; // within window if we ignore now; tests focus on logic
    let order = ["AID-Challenge", "@method", "@target-uri", "host", "date"]; // exact set

    // well-known
    let well_known = server.mock(|when, then| {
        when.method("GET").path("/.well-known/agent");
        then.status(200)
            .header("content-type", "application/json")
            .body(format!("{{\"v\":\"aid1\",\"u\":\"{}\",\"p\":\"mcp\",\"k\":\"{}\",\"i\":\"{}\"}}", server.url("/mcp"), pka, kid));
    });

    // handshake (valid)
    let handshake_ok = server.mock(|when, then| {
        when.method("GET").path("/mcp");
        then.status(200).header("date", "Thu, 01 Jan 2026 00:00:00 GMT").header_fn("Signature-Input", move |_, _| {
            format!("sig=(\"{}\");created={};keyid={};alg=\"ed25519\"", order.join("\" \""), created, kid)
        }).header_fn("Signature", move |req, _| {
            let challenge = req.headers.get("AID-Challenge").unwrap().to_str().unwrap();
            let date = req.headers.get("Date").unwrap().to_str().unwrap();
            let (.., base) = build_base(&order, challenge, "GET", &server.url("/mcp"), &server.address().to_string(), date, created, kid, "ed25519");
            let sig = sk.sign(&base);
            format!("sig:{}:", B64.encode(sig.to_bytes()))
        });
    });

    // Execute handshake
    futures::executor::block_on(async {
        let url = server.url("/mcp");
        perform_pka_handshake(&url, &pka, kid, Duration::from_secs(2)).await.unwrap();
    });
    well_known.assert_hits(1);
    handshake_ok.assert_hits(1);

    // handshake (kid mismatch)
    let kid2 = "b2";
    let handshake_bad = server.mock(|when, then| {
        when.method("GET").path("/bad");
        then.status(200).header("date", "Thu, 01 Jan 2026 00:00:00 GMT").header_fn("Signature-Input", move |_, _| {
            format!("sig=(\"{}\");created={};keyid={};alg=\"ed25519\"", order.join("\" \""), created, kid2)
        }).header_fn("Signature", move |req, _| {
            let challenge = req.headers.get("AID-Challenge").unwrap().to_str().unwrap();
            let date = req.headers.get("Date").unwrap().to_str().unwrap();
            let (.., base) = build_base(&order, challenge, "GET", &server.url("/bad"), &server.address().to_string(), date, created, kid2, "ed25519");
            let sig = sk.sign(&base);
            format!("sig:{}:", B64.encode(sig.to_bytes()))
        });
    });

    let res = futures::executor::block_on(async {
        let url = server.url("/bad");
        perform_pka_handshake(&url, &pka, kid, Duration::from_secs(2)).await
    });
    assert!(res.is_err());
}

#[test]
fn rust_pka_missing_fields_fails() {
    let server = MockServer::start();
    let seed = [0u8; 32];
    let sk = SigningKey::from_bytes(&seed);
    let vk = VerifyingKey::from(&sk);
    let pka = b58_z(vk.as_bytes());
    let kid = "g1";
    let created: i64 = (std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs()) as i64;
    let order = ["AID-Challenge", "@method"]; // missing required fields

    let _wk = server.mock(|when, then| {
        when.method("GET").path("/.well-known/agent");
        then.status(200)
            .header("content-type", "application/json")
            .body(format!("{{\"v\":\"aid1\",\"u\":\"{}\",\"p\":\"mcp\",\"k\":\"{}\",\"i\":\"{}\"}}", server.url("/bad2"), pka, kid));
    });
    let _hs = server.mock(|when, then| {
        when.method("GET").path("/bad2");
        then.status(200).header("date", "Thu, 01 Jan 2026 00:00:00 GMT").header_fn("Signature-Input", move |_, _| {
            format!("sig=(\"{}\");created={};keyid={};alg=\"ed25519\"", order.join("\" \""), created, kid)
        }).header_fn("Signature", move |req, _| {
            let challenge = req.headers.get("AID-Challenge").unwrap().to_str().unwrap();
            let _date = req.headers.get("Date").unwrap().to_str().unwrap();
            let mut lines: Vec<String> = Vec::new();
            for item in &order {
                match *item { "AID-Challenge" => lines.push(format!("\"AID-Challenge\": {}", challenge)), "@method" => lines.push("\"@method\": GET".to_string()), _ => {} }
            }
            let quoted = order.iter().map(|c| format!("\"{}\"", c)).collect::<Vec<_>>().join(" ");
            let params = format!("({});created={};keyid={};alg=\"ed25519\"", quoted, created, kid);
            lines.push(format!("\"@signature-params\": {}", params));
            let base = lines.join("\n").into_bytes();
            let sig = sk.sign(&base);
            format!("sig:{}:", base64::engine::general_purpose::STANDARD.encode(sig.to_bytes()))
        });
    });
    let res = futures::executor::block_on(async {
        perform_pka_handshake(&server.url("/bad2"), &pka, kid, std::time::Duration::from_secs(2)).await
    });
    assert!(res.is_err());
}

#[test]
fn rust_pka_date_skew_fails() {
    let server = MockServer::start();
    let seed = [0u8; 32];
    let sk = SigningKey::from_bytes(&seed);
    let vk = VerifyingKey::from(&sk);
    let pka = b58_z(vk.as_bytes());
    let kid = "g1";
    let created: i64 = (std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs() as i64) - 1000;
    let order = ["AID-Challenge", "@method", "@target-uri", "host", "date"]; // full set

    let _wk = server.mock(|when, then| {
        when.method("GET").path("/.well-known/agent");
        then.status(200)
            .header("content-type", "application/json")
            .body(format!("{{\"v\":\"aid1\",\"u\":\"{}\",\"p\":\"mcp\",\"k\":\"{}\",\"i\":\"{}\"}}", server.url("/bad3"), pka, kid));
    });
    let _hs = server.mock(|when, then| {
        when.method("GET").path("/bad3");
        then.status(200).header("date", "Thu, 01 Jan 2020 00:00:00 GMT").header_fn("Signature-Input", move |_, _| {
            format!("sig=(\"{}\");created={};keyid={};alg=\"ed25519\"", order.join("\" \""), created, kid)
        }).header_fn("Signature", move |req, _| {
            let challenge = req.headers.get("AID-Challenge").unwrap().to_str().unwrap();
            let date = req.headers.get("Date").unwrap().to_str().unwrap();
            let mut lines: Vec<String> = Vec::new();
            for item in &order {
                match *item {
                    "AID-Challenge" => lines.push(format!("\"AID-Challenge\": {}", challenge)),
                    "@method" => lines.push("\"@method\": GET".to_string()),
                    "@target-uri" => lines.push(format!("\"@target-uri\": {}", server.url("/bad3"))),
                    "host" => lines.push(format!("\"host\": {}", server.address().to_string())),
                    "date" => lines.push(format!("\"date\": {}", date)),
                    _ => {}
                }
            }
            let quoted = order.iter().map(|c| format!("\"{}\"", c)).collect::<Vec<_>>().join(" ");
            let params = format!("({});created={};keyid={};alg=\"ed25519\"", quoted, created, kid);
            lines.push(format!("\"@signature-params\": {}", params));
            let base = lines.join("\n").into_bytes();
            let sig = sk.sign(&base);
            format!("sig:{}:", base64::engine::general_purpose::STANDARD.encode(sig.to_bytes()))
        });
    });
    let res = futures::executor::block_on(async {
        perform_pka_handshake(&server.url("/bad3"), &pka, kid, std::time::Duration::from_secs(2)).await
    });
    assert!(res.is_err());
}
