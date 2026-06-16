#!/usr/bin/env bash
set -euo pipefail

service_name="kyvora-agent"
binary_path="/usr/local/bin/kyvora-agent"
config_dir="/etc/kyvora"
config_file="$config_dir/agent.yaml"
secret_file="$config_dir/agent.secret"
unit_file="/etc/systemd/system/$service_name.service"
purge_config=false

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

usage() {
  cat <<EOF
Usage: sudo scripts/uninstall-agent.sh [--purge-config]

Options:
  --purge-config   Remove $config_file and $secret_file.
                   By default configuration and secrets are preserved.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --purge-config)
      purge_config=true
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

[ "${EUID:-$(id -u)}" -eq 0 ] || fail "Run this uninstaller as root, for example: sudo scripts/uninstall-agent.sh"
[ "$(uname -s)" = "Linux" ] || fail "Kyvora Agent service uninstallation supports Linux only."
command -v systemctl >/dev/null 2>&1 || fail "systemctl is required. Kyvora Agent supports systemd only."
[ -d /run/systemd/system ] || fail "systemd does not appear to be running on this host."

if systemctl list-unit-files "$service_name.service" >/dev/null 2>&1 || [ -f "$unit_file" ]; then
  systemctl stop "$service_name" >/dev/null 2>&1 || true
  systemctl disable "$service_name" >/dev/null 2>&1 || true
fi

removed_unit=false
removed_binary=false
removed_config=false

if [ -f "$unit_file" ]; then
  rm -f "$unit_file"
  removed_unit=true
fi

if [ -f "$binary_path" ]; then
  rm -f "$binary_path"
  removed_binary=true
fi

systemctl daemon-reload
systemctl reset-failed "$service_name" >/dev/null 2>&1 || true

if [ "$purge_config" = true ]; then
  rm -f "$config_file" "$secret_file"
  rmdir "$config_dir" >/dev/null 2>&1 || true
  removed_config=true
fi

echo
echo "Kyvora Agent uninstalled."
echo "Removed systemd unit: $removed_unit"
echo "Removed binary: $removed_binary"
echo "Removed config and secret: $removed_config"

if [ "$purge_config" = false ]; then
  echo "Preserved configuration directory: $config_dir"
  echo "Run with --purge-config to remove $config_file and $secret_file."
fi
