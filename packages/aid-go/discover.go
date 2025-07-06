package aidgo

import (
	"context"
	"net"
	"strings"
	"time"

	"golang.org/x/net/idna"
)

// lookupTXT is an indirection to make unit testing easier.
var lookupTXT = net.DefaultResolver.LookupTXT

// Discover queries DNS for the _agent TXT record and parses it.
// Returns record and a TTL (0 when unknown).
func Discover(domain string, timeout time.Duration) (AidRecord, uint32, error) {
	// IDN → A-label
	alabel, _ := idna.ToASCII(domain)
	fqdn := strings.TrimSuffix(DNSSubdomain+"."+alabel, ".")

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	txts, err := lookupTXT(ctx, fqdn)
	if err != nil {
		return AidRecord{}, 0, newAidError("ERR_NO_RECORD", err.Error())
	}

	var lastErr error
	for _, txt := range txts {
		rec, err := Parse(txt)
		if err == nil {
			return rec, 0, nil // TTL unavailable via net package
		}
		lastErr = err
	}
	if lastErr != nil {
		return AidRecord{}, 0, lastErr
	}
	return AidRecord{}, 0, newAidError("ERR_NO_RECORD", "No valid _agent TXT record found")
}
