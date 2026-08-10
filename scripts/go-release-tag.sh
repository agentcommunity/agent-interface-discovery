#!/usr/bin/env bash

set -euo pipefail

readonly expected_module='github.com/agentcommunity/agent-identity-discovery/packages/aid-go/v2'
readonly tag_prefix='packages/aid-go'

if [[ "$#" -ne 4 ]]; then
  echo "usage: $0 <version> <target-sha> <module> <tag>" >&2
  exit 64
fi

readonly version=$1
readonly target=$2
readonly module=$3
readonly tag=$4

[[ "$version" =~ ^v2\.[0-9]+\.[0-9]+$ ]] || {
  echo "refusing invalid Go SDK version: $version" >&2
  exit 1
}
[[ "$target" =~ ^[0-9a-f]{40}$ ]] || {
  echo 'refusing target that is not a full lowercase commit SHA' >&2
  exit 1
}
test "$module" = "$expected_module" || {
  echo "refusing unexpected Go module: $module" >&2
  exit 1
}
test "$tag" = "$tag_prefix/$version" || {
  echo "refusing tag that does not match the approved Go SDK version: $tag" >&2
  exit 1
}

git fetch --prune origin
git fetch origin --tags

test "$(git rev-parse 'origin/main^{commit}')" = "$target"
test "$(git rev-parse "$target^{commit}")" = "$target"
test "$(git show "$target:packages/aid-go/go.mod" | sed -n 's/^module //p')" = "$module"

remote_direct=$(git ls-remote --tags origin "refs/tags/$tag" | awk 'NR == 1 { print $1 }')
remote_peeled=$(git ls-remote --tags origin "refs/tags/$tag^{}" | awk 'NR == 1 { print $1 }')
publish_tag=yes

if test -n "$remote_direct"; then
  test -n "$remote_peeled" || {
    echo "refusing unexpected lightweight remote tag: $tag" >&2
    exit 1
  }
  test "$remote_peeled" = "$target" || {
    echo "refusing mismatched remote tag: $tag" >&2
    exit 1
  }
  echo "exact annotated remote tag already exists; do not recreate it: $tag"
  publish_tag=no
else
  test -z "$remote_peeled"
fi

if test "$publish_tag" = yes; then
  ! git show-ref --verify --quiet "refs/tags/$tag" || {
    echo "refusing unexpected local tag: $tag" >&2
    exit 1
  }
  git tag -a "$tag" "$target" -m "Release Go SDK $version"
  test "$(git cat-file -t "$tag")" = tag
  test "$(git rev-parse "$tag^{commit}")" = "$target"
  git push origin "refs/tags/$tag"
fi

test "$(git ls-remote --tags origin "refs/tags/$tag^{}" | awk 'NR == 1 { print $1 }')" = "$target"
