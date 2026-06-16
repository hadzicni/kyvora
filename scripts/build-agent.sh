#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
agent_dir="$repo_root/apps/agent"
dist_dir="${KYVORA_AGENT_DIST_DIR:-$agent_dir/dist}"

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
    CGO_ENABLED=0 GOOS=linux GOARCH="$arch" go build -trimpath -o "$output" ./cmd/kyvora-agent
  )
}

require_command go
mkdir -p "$dist_dir"

build_agent amd64
build_agent arm64

echo
echo "Agent binaries written to $dist_dir"
