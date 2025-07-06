package aidgo

// Specification version
const SpecVersion = "aid1"

// Protocol tokens
const (
	ProtoA2A     = "a2a"
	ProtoLocal   = "local"
	ProtoMCP     = "mcp"
	ProtoOpenAPI = "openapi"
)

var ProtocolTokens = map[string]string{
	"a2a":     ProtoA2A,
	"local":   ProtoLocal,
	"mcp":     ProtoMCP,
	"openapi": ProtoOpenAPI,
}

// Auth tokens
const (
	AuthAPIKey     = "apikey"
	AuthBasic      = "basic"
	AuthCustom     = "custom"
	AuthMTLS       = "mtls"
	AuthNone       = "none"
	AuthOAuth2Code = "oauth2_code"
	AuthOAuth2Dev  = "oauth2_device"
	AuthPAT        = "pat"
)

var AuthTokens = map[string]string{
	"apikey":        AuthAPIKey,
	"basic":         AuthBasic,
	"custom":        AuthCustom,
	"mtls":          AuthMTLS,
	"none":          AuthNone,
	"oauth2_code":   AuthOAuth2Code,
	"oauth2_device": AuthOAuth2Dev,
	"pat":           AuthPAT,
}

// Error codes
const (
	ErrNoRecord         = 1000
	ErrInvalidTXT       = 1001
	ErrUnsupportedProto = 1002
	ErrSecurity         = 1003
	ErrDNSLookupFailed  = 1004
)

var errorMessages = map[int]string{
	ErrNoRecord:         "No _agent TXT record was found for the domain",
	ErrInvalidTXT:       "A record was found but is malformed or missing required keys",
	ErrUnsupportedProto: "The record is valid, but the client does not support the specified protocol",
	ErrSecurity:         "Discovery failed due to a security policy",
	ErrDNSLookupFailed:  "The DNS query failed for a network-related reason",
}

// DNS constants
const (
	DNSSubdomain = "_agent"
	DNSTTLMin    = 300
	DNSTTLMax    = 900
)

// Local URI schemes for proto=local
var LocalURISchemes = []string{"docker", "npx", "pip"}
