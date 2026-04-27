#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

terraform_output() {
  terraform -chdir="$repo_root/infra/terraform" output -raw "$1"
}

require_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    printf 'Missing required environment variable: %s\n' "$name" >&2
    exit 1
  fi
}

export VITE_API_BASE_URL="${VITE_API_BASE_URL:-$(terraform_output backend_url)}"
export VITE_FIREBASE_API_KEY="${VITE_FIREBASE_API_KEY:-$(terraform_output firebase_api_key)}"
export VITE_FIREBASE_AUTH_DOMAIN="${VITE_FIREBASE_AUTH_DOMAIN:-$(terraform_output firebase_auth_domain)}"
export VITE_FIREBASE_PROJECT_ID="${VITE_FIREBASE_PROJECT_ID:-$(terraform_output firebase_project_id)}"
export VITE_FIREBASE_APP_ID="${VITE_FIREBASE_APP_ID:-$(terraform_output firebase_app_id)}"
unset VITE_FIREBASE_AUTH_EMULATOR_URL

require_env VITE_API_BASE_URL
require_env VITE_FIREBASE_API_KEY
require_env VITE_FIREBASE_AUTH_DOMAIN
require_env VITE_FIREBASE_PROJECT_ID
require_env VITE_FIREBASE_APP_ID

cd "$repo_root"
bun run --filter @carebid/web build
