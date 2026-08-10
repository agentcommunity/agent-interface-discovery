#!/usr/bin/env bash

set -euo pipefail

repository_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
guard="$repository_root/scripts/go-release-tag.sh"
test -x "$guard" || {
  echo "missing executable release guard: $guard" >&2
  exit 1
}
temporary_directory=$(mktemp -d)
trap 'rm -rf "$temporary_directory"' EXIT

fake_git_directory="$temporary_directory/bin"
command_log="$temporary_directory/git.log"
mkdir -p "$fake_git_directory"

cat > "$fake_git_directory/git" <<'EOF'
#!/usr/bin/env bash

set -euo pipefail

printf '%s\n' "$*" >> "$GO_RELEASE_GIT_LOG"

case "$1" in
  fetch)
    ;;
  rev-parse)
    if [[ "$2" == 'origin/main^{commit}' ]]; then
      printf '%s\n' "$GO_RELEASE_ORIGIN_MAIN"
    else
      printf '%s\n' "${2%\^\{commit\}}"
    fi
    ;;
  show)
    printf 'module %s\n' "$GO_RELEASE_TARGET_MODULE"
    ;;
  *)
    printf 'unexpected git invocation: %s\n' "$*" >&2
    exit 97
    ;;
esac
EOF
chmod +x "$fake_git_directory/git"

assert_no_tag_push() {
  if grep -Fxq 'push origin refs/tags/packages/aid-go/v2.1.1' "$command_log"; then
    echo 'a rejected release input reached the tag push' >&2
    exit 1
  fi
}

run_rejected_case() {
  local name=$1
  local target=$2
  local target_module=$3
  : > "$command_log"

  if PATH="$fake_git_directory:$PATH" \
    GO_RELEASE_GIT_LOG="$command_log" \
    GO_RELEASE_ORIGIN_MAIN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
    GO_RELEASE_TARGET_MODULE="$target_module" \
    "$guard" \
      v2.1.1 \
      "$target" \
      github.com/agentcommunity/agent-identity-discovery/packages/aid-go/v2 \
      packages/aid-go/v2.1.1; then
    echo "expected $name to be rejected" >&2
    exit 1
  fi

  assert_no_tag_push
}

run_rejected_case \
  'target that is not origin/main' \
  bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb \
  github.com/agentcommunity/agent-identity-discovery/packages/aid-go/v2
run_rejected_case \
  'module declaration that does not match the canonical module' \
  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  github.com/agentcommunity/agent-identity-discovery/packages/other/v2

echo 'Go release tag guard rejects mismatched target and module before push.'
