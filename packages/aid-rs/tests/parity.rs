use std::fs;
use std::path::PathBuf;

use aid_rs::parse;

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..").join("..")
}

fn load_fixture() -> String {
    let path = repo_root().join("test-fixtures").join("golden.json");
    fs::read_to_string(path).expect("read golden.json")
}

#[derive(Debug)]
struct FixtureRec {
    raw: String,
    expected: std::collections::HashMap<String, String>,
}

fn parse_golden_minimal(json: &str) -> Vec<FixtureRec> {
    let mut out = Vec::new();
    let mut i = 0;
    let bytes = json.as_bytes();
    while i < bytes.len() {
        if let Some(pos) = json[i..].find("\"raw\"") {
            i += pos;
            let after_colon = json[i..].find(':').map(|p| i + p + 1).unwrap();
            let start_quote = json[after_colon..].find('"').map(|p| after_colon + p + 1).unwrap();
            let end_quote = json[start_quote..].find('"').map(|p| start_quote + p).unwrap();
            let raw = &json[start_quote..end_quote];

            let expected_key_pos = json[end_quote..].find("\"expected\"").unwrap();
            let j = end_quote + expected_key_pos;
            let brace_start = json[j..].find('{').map(|p| j + p).unwrap();
            let mut k = brace_start + 1;
            let mut depth = 1;
            while k < bytes.len() {
                match bytes[k] as char {
                    '{' => depth += 1,
                    '}' => { depth -= 1; if depth == 0 { break; } }
                    _ => {}
                }
                k += 1;
            }
            let obj = &json[brace_start + 1..k];
            let mut expected = std::collections::HashMap::new();
            for entry in obj.split(',') {
                let mut parts = entry.splitn(2, ':');
                let key = parts.next().unwrap_or("").trim().trim_matches('"');
                let val = parts.next().unwrap_or("").trim().trim_matches('"');
                if !key.is_empty() && !val.is_empty() { expected.insert(key.to_string(), val.to_string()); }
            }
            out.push(FixtureRec { raw: raw.to_string(), expected });
            i = k;
        } else { break; }
    }
    out
}

#[test]
fn parity_from_golden() {
    let data = load_fixture();
    let cases = parse_golden_minimal(&data);
    assert!(!cases.is_empty(), "no cases parsed from golden.json");
    for case in cases {
        let parsed = parse(&case.raw).expect("parse ok");
        let mut got = std::collections::HashMap::new();
        got.insert("v".to_string(), parsed.v);
        got.insert("uri".to_string(), parsed.uri);
        got.insert("proto".to_string(), parsed.proto);
        if let Some(a) = parsed.auth { got.insert("auth".to_string(), a); }
        if let Some(d) = parsed.desc { got.insert("desc".to_string(), d); }
        assert_eq!(got, case.expected);
    }
}

#[test]
fn invalid_cases_error_codes() {
    let err = parse("uri=https://x;p=mcp").unwrap_err();
    assert_eq!(err.error_code, "ERR_INVALID_TXT");

    let err = parse("v=aid1;uri=https://x;proto=mcp;p=mcp").unwrap_err();
    assert_eq!(err.error_code, "ERR_INVALID_TXT");

    let err = parse("v=aid1;uri=https://x;p=foo").unwrap_err();
    assert_eq!(err.error_code, "ERR_UNSUPPORTED_PROTO");

    let long_desc = "a".repeat(61);
    let err = parse(&format!("v=aid1;uri=https://x;p=mcp;desc={}", long_desc)).unwrap_err();
    assert_eq!(err.error_code, "ERR_INVALID_TXT");
}