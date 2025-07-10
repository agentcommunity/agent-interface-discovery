package aid

import (
	"context"
	"testing"
	"time"
)

func TestDiscoverSuccess(t *testing.T) {
	// Mock lookupTXT
	lookupTXT = func(_ context.Context, _ string) ([]string, error) {
		return []string{"v=aid1;uri=https://api.example.com/mcp;proto=mcp"}, nil
	}

	rec, _, err := Discover("example.com", 2*time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Proto != "mcp" {
		t.Fatalf("expected proto mcp got %s", rec.Proto)
	}
}

func TestDiscoverNoRecord(t *testing.T) {
	lookupTXT = func(_ context.Context, _ string) ([]string, error) {
		return nil, context.DeadlineExceeded
	}
	_, _, err := Discover("missing.com", time.Second)
	if err == nil {
		t.Fatalf("expected error")
	}
}
