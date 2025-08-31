package aid

import (
    "encoding/json"
    "fmt"
    "net/url"
    "strings"
    "time"
)

// parseRaw splits a TXT record string into key=value map.
func parseRaw(txt string) map[string]string {
	record := make(map[string]string)
	pairs := strings.Split(txt, ";")
	for _, p := range pairs {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		parts := strings.SplitN(p, "=", 2)
		if len(parts) != 2 {
			panic("invalid pair") // will be caught by validate
		}
		key := strings.ToLower(strings.TrimSpace(parts[0]))
		value := strings.TrimSpace(parts[1])
		record[key] = value
	}
	return record
}

// ValidateRecord validates raw map returning AidRecord or error.
func ValidateRecord(raw map[string]string) (AidRecord, error) {
    get := func(k string) (string, bool) { v, ok := raw[k]; return v, ok }
    // Helper to get canonical with alias, and check duplicates
    getAliased := func(full, alias string) (string, bool, error) {
        fv, f := get(full)
        av, a := get(alias)
        if f && a {
            return "", false, newAidError("ERR_INVALID_TXT", fmt.Sprintf("Cannot specify both \"%s\" and \"%s\"", full, alias))
        }
        if f {
            return fv, true, nil
        }
        if a {
            return av, true, nil
        }
        return "", false, nil
    }

	// required fields v, uri, proto/p
	v, ok := get("v")
	if !ok {
		return AidRecord{}, newAidError("ERR_INVALID_TXT", "Missing required field: v")
	}
	if v != SpecVersion {
		return AidRecord{}, newAidError("ERR_INVALID_TXT", fmt.Sprintf("Unsupported version: %s", v))
	}

    uri, ok, err := getAliased("uri", "u")
    if !ok {
        return AidRecord{}, newAidError("ERR_INVALID_TXT", "Missing required field: uri")
    }
    if err != nil { return AidRecord{}, err }

    protoVal, hasProto := get("proto")
    pVal, hasP := get("p")
    if hasProto && hasP {
        return AidRecord{}, newAidError("ERR_INVALID_TXT", "Cannot specify both proto and p")
    }
    if !hasProto && !hasP {
        return AidRecord{}, newAidError("ERR_INVALID_TXT", "Missing required field: proto (or p)")
	}

	proto := protoVal
	if !hasProto {
		proto = pVal
	}
	if _, ok := ProtocolTokens[proto]; !ok {
		return AidRecord{}, newAidError("ERR_UNSUPPORTED_PROTO", fmt.Sprintf("Unsupported protocol: %s", proto))
	}

	// auth token
    if auth, ok, err := getAliased("auth", "a"); ok {
        if _, exists := AuthTokens[auth]; !exists {
            return AidRecord{}, newAidError("ERR_INVALID_TXT", fmt.Sprintf("Invalid auth token: %s", auth))
        }
    } else if err != nil {
        return AidRecord{}, err
    }

    // desc length
    if desc, ok, err := getAliased("desc", "s"); ok {
        if len([]byte(desc)) > 60 {
            return AidRecord{}, newAidError("ERR_INVALID_TXT", "Description field must be ≤ 60 UTF-8 bytes")
        }
    } else if err != nil {
        return AidRecord{}, err
    }

    // docs URL
    if docs, ok, err := getAliased("docs", "d"); ok {
        if !strings.HasPrefix(docs, "https://") {
            return AidRecord{}, newAidError("ERR_INVALID_TXT", "docs MUST be an absolute https:// URL")
        }
        if _, perr := url.ParseRequestURI(docs); perr != nil {
            return AidRecord{}, newAidError("ERR_INVALID_TXT", fmt.Sprintf("Invalid docs URL: %s", docs))
        }
    } else if err != nil { return AidRecord{}, err }

    // dep timestamp
    if dep, ok, err := getAliased("dep", "e"); ok {
        if !strings.HasSuffix(dep, "Z") {
            return AidRecord{}, newAidError("ERR_INVALID_TXT", "dep MUST be an ISO 8601 UTC timestamp (e.g., 2026-01-01T00:00:00Z)")
        }
        if _, perr := time.Parse(time.RFC3339, dep); perr != nil {
            return AidRecord{}, newAidError("ERR_INVALID_TXT", "dep MUST be an ISO 8601 UTC timestamp (e.g., 2026-01-01T00:00:00Z)")
        }
    } else if err != nil { return AidRecord{}, err }

	// URI validation
    if proto == "local" {
        schemeSplit := strings.SplitN(uri, ":", 2)
        if len(schemeSplit) < 2 {
            return AidRecord{}, newAidError("ERR_INVALID_TXT", "Invalid URI scheme for local protocol")
        }
        scheme := schemeSplit[0]
        allowed := false
        for _, s := range LocalUriSchemes {
            if s == scheme {
                allowed = true
                break
            }
        }
        if !allowed {
            return AidRecord{}, newAidError("ERR_INVALID_TXT", "Invalid URI scheme for local protocol")
        }
    } else if proto == "zeroconf" {
        if !strings.HasPrefix(uri, "zeroconf:") {
            return AidRecord{}, newAidError("ERR_INVALID_TXT", "Invalid URI scheme for 'zeroconf'. MUST be 'zeroconf:'")
        }
    } else if proto == "websocket" {
        if !strings.HasPrefix(uri, "wss://") {
            return AidRecord{}, newAidError("ERR_INVALID_TXT", "Invalid URI scheme for 'websocket'. MUST be 'wss:'")
        }
        if _, err := url.ParseRequestURI(uri); err != nil {
            return AidRecord{}, newAidError("ERR_INVALID_TXT", fmt.Sprintf("Invalid URI format: %s", uri))
        }
    } else {
        if !strings.HasPrefix(uri, "https://") {
            return AidRecord{}, newAidError("ERR_INVALID_TXT", fmt.Sprintf("Invalid URI scheme for remote protocol '%s'. MUST be 'https:'", proto))
        }
        if _, err := url.ParseRequestURI(uri); err != nil {
            return AidRecord{}, newAidError("ERR_INVALID_TXT", fmt.Sprintf("Invalid URI format: %s", uri))
        }
    }

    rec := AidRecord{V: SpecVersion, URI: uri, Proto: proto}
    if auth, ok := get("auth"); ok { rec.Auth = auth } else if a, ok := get("a"); ok { rec.Auth = a }
    if desc, ok := get("desc"); ok { rec.Desc = desc } else if s, ok := get("s"); ok { rec.Desc = s }
    if docs, ok := get("docs"); ok { rec.Docs = docs } else if d, ok := get("d"); ok { rec.Docs = d }
    if dep, ok := get("dep"); ok { rec.Dep = dep } else if e, ok := get("e"); ok { rec.Dep = e }
    if pka, ok := get("pka"); ok { rec.Pka = pka } else if k, ok := get("k"); ok { rec.Pka = k }
    if kid, ok := get("kid"); ok { rec.Kid = kid } else if i, ok := get("i"); ok { rec.Kid = i }
    if rec.Pka != "" && rec.Kid == "" {
        return AidRecord{}, newAidError("ERR_INVALID_TXT", "kid is required when pka is present")
    }
    return rec, nil
}

// Parse parses and validates a TXT record string.
func Parse(txt string) (AidRecord, error) {
	raw := parseRaw(txt)
	return ValidateRecord(raw)
}

// JSONString returns compact JSON representation for debugging.
func (r AidRecord) JSONString() string {
	b, _ := json.Marshal(r)
	return string(b)
}
