package aidgo

import "testing"

func TestParseValidRecord(t *testing.T) {
	txt := "v=aid1;uri=https://api.example.com/mcp;proto=mcp;auth=pat;desc=Test Agent"
	rec, err := Parse(txt)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Proto != "mcp" || rec.Auth != "pat" {
		t.Fatalf("unexpected record %+v", rec)
	}
}

func TestParseAliasP(t *testing.T) {
	txt := "v=aid1;uri=https://api.example.com/mcp;p=mcp"
	rec, err := Parse(txt)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Proto != "mcp" {
		t.Fatalf("proto mismatch")
	}
}

func TestInvalidProto(t *testing.T) {
	txt := "v=aid1;uri=https://api.example.com/mcp;proto=unknown"
	_, err := Parse(txt)
	if err == nil {
		t.Fatalf("expected error")
	}
}
