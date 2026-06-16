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

cleanup() {
  if [ -n "$temp_binary" ] && [ -f "$temp_binary" ]; then
    rm -f "$temp_binary"
  fi
}
trap cleanup EXIT

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_command() {
  local command_name="$1"

  command -v "$command_name" >/dev/null 2>&1 || fail "Required command not found: $command_name"
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

repo_root() {
  cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd
}

find_or_build_binary() {
  local arch="$1"
  local root
  root="$(repo_root)"

  if [ "${KYVORA_AGENT_BINARY:-}" != "" ]; then
    [ -f "$KYVORA_AGENT_BINARY" ] || fail "KYVORA_AGENT_BINARY does not exist: $KYVORA_AGENT_BINARY"
    source_binary="$KYVORA_AGENT_BINARY"
    return
  fi

  for candidate in \
    "$root/apps/agent/dist/kyvora-agent-linux-$arch" \
    "$root/dist/kyvora-agent-linux-$arch" \
    "$root/kyvora-agent-linux-$arch"; do
    if [ -f "$candidate" ]; then
      source_binary="$candidate"
      return
    fi
  done

  if [ -d "$root/apps/agent" ] && command -v go >/dev/null 2>&1; then
    temp_binary="$(mktemp "/tmp/kyvora-agent-$arch.XXXXXX")"
    echo "No prebuilt agent binary found; building linux/$arch from source."
    (
      cd "$root/apps/agent"
      CGO_ENABLED=0 GOOS=linux GOARCH="$arch" go build -trimpath -o "$temp_binary" ./cmd/kyvora-agent
    )
    source_binary="$temp_binary"
    return
  fi

  fail "No agent binary found. Run scripts/build-agent.sh first or set KYVORA_AGENT_BINARY=/path/to/kyvora-agent-linux-$arch."
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

require_root
require_linux_systemd
arch="$(detect_arch)"
find_or_build_binary "$arch"

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
