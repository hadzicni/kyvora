#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
agent_dir="$repo_root/apps/agent"
dist_dir="${KYVORA_AGENT_DIST_DIR:-$agent_dir/dist}"
version="${KYVORA_AGENT_VERSION:-$(tr -d '[:space:]' < "$repo_root/VERSION")}"

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "ERROR: Required command not found: $command_name" >&2
    exit 1
  fi
}

build_agent() {
  local arch="$1"
  local output="$dist_dir/kyvora-agent-linux-$arch"

  echo "Building $output"
  (
    cd "$agent_dir"
    CGO_ENABLED=0 GOOS=linux GOARCH="$arch" go build \
      -trimpath \
      -ldflags "-s -w -X main.version=$version" \
      -o "$output" \
      ./cmd/kyvora-agent
  )
  chmod 0755 "$output"
}

require_command go
mkdir -p "$dist_dir"

build_agent amd64
build_agent arm64

(
  cd "$dist_dir"
  sha256sum kyvora-agent-linux-amd64 kyvora-agent-linux-arm64 > checksums.txt
)

echo
echo "Agent binaries written to $dist_dir"
