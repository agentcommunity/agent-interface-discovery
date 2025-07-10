package aid

import (
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	// This function serves as a test anchor to ensure that all .go files
	// in the package, including constants_gen.go, are compiled together
	// during test execution. It prevents "undefined" errors for generated
	// constants.
	os.Exit(m.Run())
}
