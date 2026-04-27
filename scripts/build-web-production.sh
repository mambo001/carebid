#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export VITE_API_BASE_URL="$(terraform -chdir="$repo_root/infra/terraform" output -raw backend_url)"
export VITE_FIREBASE_API_KEY="$(terraform -chdir="$repo_root/infra/terraform" output -raw firebase_api_key)"
export VITE_FIREBASE_AUTH_DOMAIN="$(terraform -chdir="$repo_root/infra/terraform" output -raw firebase_auth_domain)"
export VITE_FIREBASE_PROJECT_ID="$(terraform -chdir="$repo_root/infra/terraform" output -raw firebase_project_id)"
export VITE_FIREBASE_APP_ID="$(terraform -chdir="$repo_root/infra/terraform" output -raw firebase_app_id)"
unset VITE_FIREBASE_AUTH_EMULATOR_URL

cd "$repo_root"
bun run --filter @carebid/web build
