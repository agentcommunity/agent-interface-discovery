package aid

// AidRecord holds the parsed key-value pairs from a TXT record.
type AidRecord struct {
	V     string `json:"v"`
	URI   string `json:"uri"`
	Proto string `json:"proto"`
	Auth  string `json:"auth,omitempty"`
	Desc  string `json:"desc,omitempty"`
}
