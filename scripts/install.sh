#!/usr/bin/env bash
set -euo pipefail

compose_file="docker-compose.yml"
env_example=".env.example"
env_file=".env"
install_ref="${KYVORA_INSTALL_REF:-main}"
install_dir="${KYVORA_INSTALL_DIR:-./kyvora}"
raw_base_url="https://raw.githubusercontent.com/hadzicni/kyvora/$install_ref"

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "ERROR: Required command not found: $command_name" >&2
    exit 1
  fi
}

require_file() {
  local file_path="$1"

  if [ ! -f "$file_path" ]; then
    echo "ERROR: Required file not found: $file_path" >&2
    exit 1
  fi
}

download_file() {
  local source_url="$1"
  local destination="$2"

  echo "Downloading $destination from $source_url."
  curl -fsSL "$source_url" -o "$destination"
}

is_local_script_file() {
  local source_path="${BASH_SOURCE[0]:-}"

  case "$source_path" in
    ""|"-"|/dev/fd/*|/proc/*/fd/*)
      return 1
      ;;
  esac

  [ -f "$source_path" ]
}

select_workdir() {
  if is_local_script_file; then
    local script_dir
    local repo_root

    script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
    repo_root="$(cd -- "$script_dir/.." && pwd)"

    if [ -f "$compose_file" ] && [ -f "$env_example" ]; then
      return
    fi

    if [ -f "$repo_root/$compose_file" ] || [ -f "$repo_root/$env_example" ]; then
      cd "$repo_root"
      return
    fi
  fi

  mkdir -p "$install_dir"
  cd "$install_dir"
}

ensure_production_files() {
  local needs_download=false

  if [ ! -f "$compose_file" ] || [ ! -f "$env_example" ]; then
    needs_download=true
  fi

  if [ "$needs_download" = false ]; then
    return
  fi

  require_command curl

  if [ ! -f "$compose_file" ]; then
    download_file "$raw_base_url/$compose_file" "$compose_file"
  fi

  if [ ! -f "$env_example" ]; then
    download_file "$raw_base_url/$env_example" "$env_example"
  fi
}

set_env_value() {
  local key="$1"
  local value="$2"
  local tmp_file

  tmp_file="$(mktemp)"

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      "$key="*)
        printf '%s=%s\n' "$key" "$value" >> "$tmp_file"
        ;;
      *)
        printf '%s\n' "$line" >> "$tmp_file"
        ;;
    esac
  done < "$env_file"

  mv "$tmp_file" "$env_file"
}

get_env_value() {
  local key="$1"
  local line

  line="$(grep -E "^${key}=" "$env_file" | tail -n 1 || true)"
  printf '%s\n' "${line#*=}"
}

generate_secret() {
  openssl rand -base64 48
}

select_workdir
ensure_production_files
require_file "$compose_file"
require_file "$env_example"

require_command docker
require_command openssl

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: Required command not available: docker compose" >&2
  exit 1
fi

if [ -f "$env_file" ]; then
  echo ".env already exists; leaving it unchanged."
else
  echo "Creating .env from $env_example."
  cp "$env_example" "$env_file"

  set_env_value "POSTGRES_PASSWORD" "$(generate_secret)"
  set_env_value "KYVORA_JWT_SECRET" "$(generate_secret)"
  set_env_value "NEXTAUTH_SECRET" "$(generate_secret)"

  if [ "${KYVORA_VERSION:-}" != "" ]; then
    set_env_value "KYVORA_VERSION" "$KYVORA_VERSION"
  fi

  if [ "${NEXTAUTH_URL:-}" != "" ]; then
    set_env_value "NEXTAUTH_URL" "$NEXTAUTH_URL"
  fi

  if [ "${KYVORA_WEB_PORT:-}" != "" ]; then
    set_env_value "KYVORA_WEB_PORT" "$KYVORA_WEB_PORT"
  fi
fi

echo "Starting Kyvora production stack."
docker compose -f "$compose_file" up -d

app_url="${NEXTAUTH_URL:-$(get_env_value "NEXTAUTH_URL")}"

echo
echo "Kyvora is starting."
echo "App URL: $app_url"
echo
echo "View the first admin password:"
echo "  docker compose -f $compose_file logs api"
echo
echo "Update Kyvora:"
echo "  docker compose -f $compose_file pull"
echo "  docker compose -f $compose_file up -d"
