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

while (( $# > 0 )); do
  case "$1" in
    -c|-C|--config-env|--exec-path|--git-dir|--work-tree|--namespace|--super-prefix)
      (( $# >= 2 )) || {
        echo "missing value for Git global option: $1" >&2
        exit 98
      }
      shift 2
      ;;
    -c?*|-C?*|--config-env=*|--exec-path=*|--git-dir=*|--work-tree=*|--namespace=*|--super-prefix=*)
      shift
      ;;
    -p|-P|-v|-h|--version|--help|--paginate|--no-pager|--no-replace-objects|--bare|--literal-pathspecs|--glob-pathspecs|--noglob-pathspecs|--icase-pathspecs|--no-optional-locks)
      shift
      ;;
    --)
      shift
      break
      ;;
    -*)
      echo "unsupported Git global option in fake recorder: $1" >&2
      exit 98
      ;;
    *)
      break
      ;;
  esac
done

(( $# > 0 )) || {
  echo 'missing Git subcommand in fake recorder' >&2
  exit 98
}

subcommand=$1
shift
printf 'subcommand=%s\n' "$subcommand" >> "$GO_RELEASE_GIT_LOG"

case "$subcommand" in
  fetch)
    ;;
  rev-parse)
    if [[ "${1-}" == 'origin/main^{commit}' ]]; then
      printf '%s\n' "$GO_RELEASE_ORIGIN_MAIN"
    else
      printf '%s\n' "${1%\^\{commit\}}"
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

assert_no_git_push() {
  if grep -Fxq 'subcommand=push' "$command_log"; then
    echo 'a rejected release input reached git push' >&2
    return 1
  fi
}

prove_push_matcher_rejects_any_push() {
  local name=$1
  shift
  : > "$command_log"

  if GO_RELEASE_GIT_LOG="$command_log" "$fake_git_directory/git" "$@" >/dev/null 2>&1; then
    echo "the fake git recorder unexpectedly accepted $name" >&2
    exit 1
  fi
  if assert_no_git_push >/dev/null 2>&1; then
    echo "the push matcher accepted $name" >&2
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

  assert_no_git_push
}

prove_push_matcher_rejects_any_push \
  'an option-bearing, destination-qualified push' \
  push --force different-remote refs/tags/other:refs/tags/other
prove_push_matcher_rejects_any_push \
  'a -c global option before push' \
  -c protocol.version=2 push different-remote refs/tags/other
prove_push_matcher_rejects_any_push \
  'a -C global option before push' \
  -C repository push different-remote refs/tags/other

run_rejected_case \
  'target that is not origin/main' \
  bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb \
  github.com/agentcommunity/agent-identity-discovery/packages/aid-go/v2
run_rejected_case \
  'module declaration that does not match the canonical module' \
  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  github.com/agentcommunity/agent-identity-discovery/packages/other/v2

echo 'Go release tag guard rejects mismatched target and module before push.'
