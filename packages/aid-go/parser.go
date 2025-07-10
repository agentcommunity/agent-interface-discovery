package aid

import (
	"encoding/json"
	"fmt"
	"net/url"
	"strings"
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

	// required fields v, uri, proto/p
	v, ok := get("v")
	if !ok {
		return AidRecord{}, newAidError("ERR_INVALID_TXT", "Missing required field: v")
	}
	if v != SpecVersion {
		return AidRecord{}, newAidError("ERR_INVALID_TXT", fmt.Sprintf("Unsupported version: %s", v))
	}

	uri, ok := get("uri")
	if !ok {
		return AidRecord{}, newAidError("ERR_INVALID_TXT", "Missing required field: uri")
	}

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
	if auth, ok := get("auth"); ok {
		if _, exists := AuthTokens[auth]; !exists {
			return AidRecord{}, newAidError("ERR_INVALID_TXT", fmt.Sprintf("Invalid auth token: %s", auth))
		}
	}

	// desc length
	if desc, ok := get("desc"); ok {
		if len([]byte(desc)) > 60 {
			return AidRecord{}, newAidError("ERR_INVALID_TXT", "Description field must be ≤ 60 UTF-8 bytes")
		}
	}

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
	} else {
		if !strings.HasPrefix(uri, "https://") {
			return AidRecord{}, newAidError("ERR_INVALID_TXT", fmt.Sprintf("Invalid URI scheme for remote protocol '%s'. MUST be 'https:'", proto))
		}
		if _, err := url.ParseRequestURI(uri); err != nil {
			return AidRecord{}, newAidError("ERR_INVALID_TXT", fmt.Sprintf("Invalid URI format: %s", uri))
		}
	}

	rec := AidRecord{V: SpecVersion, URI: uri, Proto: proto}
	if auth, ok := get("auth"); ok {
		rec.Auth = auth
	}
	if desc, ok := get("desc"); ok {
		rec.Desc = desc
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
