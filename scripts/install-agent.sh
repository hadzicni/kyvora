#!/usr/bin/env bash
set -euo pipefail

service_name="kyvora-agent"
service_user="kyvora-agent"
service_group="kyvora-agent"
binary_path="/usr/local/bin/kyvora-agent"
config_dir="/etc/kyvora"
config_file="$config_dir/agent.yaml"
secret_file="$config_dir/agent.secret"
unit_file="/etc/systemd/system/$service_name.service"
listen_address="127.0.0.1"
listen_port="9187"
temp_binary=""
source_binary=""
github_repo="${KYVORA_GITHUB_REPO:-hadzicni/kyvora}"
release_version="${KYVORA_AGENT_VERSION:-}"
local_binary=""
downloaded_from=""

cleanup() {
  if [ -n "$temp_binary" ] && [ -f "$temp_binary" ]; then
    rm -f "$temp_binary"
  fi
}
trap cleanup EXIT

usage() {
  cat <<EOF
Usage: sudo scripts/install-agent.sh [--version <tag>] [--local <path>]

Options:
  --version <tag>  Install from a specific GitHub Release tag, for example v1.0.0.
                   Defaults to the latest GitHub Release.
  --local <path>   Install an explicit local kyvora-agent binary for development.
  -h, --help       Show this help.

Environment:
  KYVORA_AGENT_VERSION=<tag>       Same as --version.
  KYVORA_GITHUB_REPO=owner/repo    Defaults to hadzicni/kyvora.
EOF
}

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_command() {
  local command_name="$1"

  command -v "$command_name" >/dev/null 2>&1 || fail "Required command not found: $command_name"
}

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --version)
        [ "$#" -ge 2 ] || fail "--version requires a tag value"
        release_version="$2"
        shift
        ;;
      --local)
        [ "$#" -ge 2 ] || fail "--local requires a binary path"
        local_binary="$2"
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        fail "Unknown argument: $1"
        ;;
    esac
    shift
  done

  if [ -n "$release_version" ] && [ -n "$local_binary" ]; then
    fail "Use either --version/KYVORA_AGENT_VERSION or --local, not both."
  fi
}

require_linux_systemd() {
  [ "$(uname -s)" = "Linux" ] || fail "Kyvora Agent service installation supports Linux only."
  command -v systemctl >/dev/null 2>&1 || fail "systemctl is required. Kyvora Agent supports systemd only."
  [ -d /run/systemd/system ] || fail "systemd does not appear to be running on this host."
}

require_root() {
  [ "${EUID:-$(id -u)}" -eq 0 ] || fail "Run this installer as root, for example: sudo scripts/install-agent.sh"
}

detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64)
      printf '%s\n' "amd64"
      ;;
    aarch64|arm64)
      printf '%s\n' "arm64"
      ;;
    *)
      fail "Unsupported Linux CPU architecture: $(uname -m)"
      ;;
  esac
}

download_base_url() {
  if [ -n "$release_version" ]; then
    printf 'https://github.com/%s/releases/download/%s\n' "$github_repo" "$release_version"
  else
    printf 'https://github.com/%s/releases/latest/download\n' "$github_repo"
  fi
}

download_file() {
  local url="$1"
  local destination="$2"

  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url" -o "$destination"
    return
  fi
  if command -v wget >/dev/null 2>&1; then
    wget -qO "$destination" "$url"
    return
  fi
  fail "curl or wget is required to download Kyvora Agent release assets."
}

download_release_binary() {
  local arch="$1"
  local asset_name="kyvora-agent-linux-$arch"
  local base_url
  local binary_url
  local checksum_url
  local checksum_file

  base_url="$(download_base_url)"
  binary_url="$base_url/$asset_name"
  checksum_url="$base_url/checksums.txt"
  temp_binary="$(mktemp "/tmp/kyvora-agent-$arch.XXXXXX")"
  checksum_file="$(mktemp "/tmp/kyvora-agent-checksums.XXXXXX")"

  echo "Downloading $asset_name from GitHub Releases."
  download_file "$binary_url" "$temp_binary"

  [ -s "$temp_binary" ] || fail "Downloaded agent binary is empty: $binary_url"

  if command -v sha256sum >/dev/null 2>&1; then
    if download_file "$checksum_url" "$checksum_file"; then
      if grep -E "[[:space:]]$asset_name$" "$checksum_file" >/dev/null 2>&1; then
        (
          cd "$(dirname "$temp_binary")"
          grep -E "[[:space:]]$asset_name$" "$checksum_file" | sed "s#$asset_name#$(basename "$temp_binary")#" | sha256sum -c -
        ) >/dev/null
        echo "Checksum verified for $asset_name."
      else
        echo "WARNING: checksums.txt did not contain $asset_name; skipping checksum verification." >&2
      fi
    else
      echo "WARNING: checksums.txt was not available; skipping checksum verification." >&2
    fi
  else
    echo "WARNING: sha256sum is not available; skipping checksum verification." >&2
  fi

  chmod 0755 "$temp_binary"
  source_binary="$temp_binary"
  downloaded_from="$binary_url"
  rm -f "$checksum_file"
}

use_local_binary() {
  [ -f "$local_binary" ] || fail "Local agent binary does not exist: $local_binary"
  [ -s "$local_binary" ] || fail "Local agent binary is empty: $local_binary"
  source_binary="$local_binary"
  downloaded_from="local file $local_binary"
}

create_user_and_group() {
  local login_shell="/usr/sbin/nologin"
  if [ ! -x "$login_shell" ]; then
    if [ -x /sbin/nologin ]; then
      login_shell="/sbin/nologin"
    else
      login_shell="/bin/false"
    fi
  fi

  if ! getent group "$service_group" >/dev/null 2>&1; then
    groupadd --system "$service_group"
  fi

  if ! id -u "$service_user" >/dev/null 2>&1; then
    useradd \
      --system \
      --gid "$service_group" \
      --home-dir /var/lib/kyvora-agent \
      --create-home \
      --shell "$login_shell" \
      "$service_user"
  fi
}

create_config_dir() {
  install -d -o root -g "$service_group" -m 0750 "$config_dir"
}

install_binary() {
  local source_binary="$1"

  install -o root -g root -m 0755 "$source_binary" "$binary_path"
}

create_config_if_missing() {
  if [ -f "$config_file" ]; then
    return
  fi

  cat > "$config_file" <<EOF
server:
  listenAddress: "$listen_address"
  listenPort: $listen_port

security:
  sharedSecretFile: "$secret_file"

logging:
  level: "info"
EOF
}

create_secret_if_missing() {
  if [ -f "$secret_file" ]; then
    return
  fi

  require_command openssl
  umask 027
  openssl rand -base64 48 > "$secret_file"
}

set_permissions() {
  chown root:"$service_group" "$config_dir"
  chmod 0750 "$config_dir"

  chown root:"$service_group" "$config_file"
  chmod 0640 "$config_file"

  chown root:"$service_group" "$secret_file"
  chmod 0640 "$secret_file"
}

install_unit() {
  local tmp_unit
  tmp_unit="$(mktemp)"

  cat > "$tmp_unit" <<EOF
[Unit]
Description=Kyvora Agent
Documentation=https://github.com/hadzicni/kyvora
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$service_user
Group=$service_group
ExecStart=$binary_path --config $config_file
Restart=on-failure
RestartSec=5s

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF

  install -o root -g root -m 0644 "$tmp_unit" "$unit_file"
  rm -f "$tmp_unit"
}

read_config_value() {
  local key="$1"
  awk -F: -v wanted="$key" '
    $1 ~ "^[[:space:]]*" wanted "$" {
      value=$2
      sub(/^[[:space:]]*/, "", value)
      gsub(/^"|"$/, "", value)
      print value
      exit
    }
  ' "$config_file"
}

parse_args "$@"
require_root
require_linux_systemd
arch="$(detect_arch)"
if [ -n "$local_binary" ]; then
  use_local_binary
else
  download_release_binary "$arch"
fi

create_user_and_group
create_config_dir
install_binary "$source_binary"
create_config_if_missing
create_secret_if_missing
set_permissions
install_unit

systemctl daemon-reload
systemctl enable "$service_name"
systemctl restart "$service_name"

configured_address="$(read_config_value listenAddress)"
configured_port="$(read_config_value listenPort)"

echo
echo "Kyvora Agent installed as a systemd service."
echo "Service: $service_name"
echo "Binary source: $downloaded_from"
echo "Config: $config_file"
echo "Secret: $secret_file (not printed)"
echo "Listen address: ${configured_address:-$listen_address}"
echo "Listen port: ${configured_port:-$listen_port}"
echo
echo "Next steps:"
echo "  sudo systemctl status $service_name"
echo "  sudo journalctl -u $service_name -f"
echo "  sudo nano $config_file"
echo
echo "Use the configured URL and shared secret when adding this agent in Kyvora."
echo "Do not expose the agent port publicly."
