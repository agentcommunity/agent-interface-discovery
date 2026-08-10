package aid

import (
	"os"
	"strings"
	"testing"
)

const (
	goModuleRepository       = "github.com/agentcommunity/agent-identity-discovery"
	goModulePath             = goModuleRepository + "/packages/aid-go/v2"
	goModuleReleaseTagPrefix = "packages/aid-go/v2"
)

func TestModulePathSupportsV2SubmoduleRelease(t *testing.T) {
	goMod, err := os.ReadFile("go.mod")
	if err != nil {
		t.Fatalf("read go.mod: %v", err)
	}

	moduleLine := "module " + goModulePath
	if !strings.Contains(string(goMod), moduleLine+"\n") {
		t.Fatalf("module must declare %q so consumers import the v2 submodule and releases use %s.Y.Z", goModulePath, goModuleReleaseTagPrefix)
	}
}
