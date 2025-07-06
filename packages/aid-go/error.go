package aidgo

import "fmt"

// AidError provides richer error context with spec numeric code.
// Implements the error interface.

type AidError struct {
	Symbol string
	Code   int
	Msg    string
}

func (e *AidError) Error() string {
	return fmt.Sprintf("%s (%d): %s", e.Symbol, e.Code, e.Msg)
}

func newAidError(symbol string, msg string) *AidError {
	codeMap := map[string]int{
		"ERR_NO_RECORD":         ErrNoRecord,
		"ERR_INVALID_TXT":       ErrInvalidTXT,
		"ERR_UNSUPPORTED_PROTO": ErrUnsupportedProto,
		"ERR_SECURITY":          ErrSecurity,
		"ERR_DNS_LOOKUP_FAILED": ErrDNSLookupFailed,
	}
	return &AidError{Symbol: symbol, Code: codeMap[symbol], Msg: msg}
}
