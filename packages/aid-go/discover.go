package aid

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
	fqdn := strings.TrimSuffix(DnsSubdomain+"."+alabel, ".")

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

    txts, err := lookupTXT(ctx, fqdn)
    if err == nil {
        var lastErr error
        for _, txt := range txts {
            rec, perr := Parse(txt)
            if perr == nil {
                // Perform PKA handshake if present
                if rec.Pka != "" {
                    if err := performPKAHandshake(rec.URI, rec.Pka, rec.Kid, timeout); err != nil {
                        return AidRecord{}, 0, err
                    }
                }
                return rec, 0, nil // TTL unavailable via net package
            }
            lastErr = perr
        }
        if lastErr != nil {
            // Try .well-known on ERR_NO_RECORD or DNS lookup failures only
            if ae, ok := lastErr.(*AidError); ok && (ae.Symbol == "ERR_NO_RECORD" || ae.Symbol == "ERR_DNS_LOOKUP_FAILED") {
                goto WELLKNOWN
            }
            return AidRecord{}, 0, lastErr
        }
        // No valid records
        goto WELLKNOWN
    }

    // DNS error → consider fallback
   WELLKNOWN:
    rec, werr := fetchWellKnown(alabel, timeout)
    if werr != nil {
        return AidRecord{}, 0, werr
    }
    if rec.Pka != "" {
        if err := performPKAHandshake(rec.URI, rec.Pka, rec.Kid, timeout); err != nil {
            return AidRecord{}, 0, err
        }
    }
    return rec, uint32(DnsTtlMin), nil
}
