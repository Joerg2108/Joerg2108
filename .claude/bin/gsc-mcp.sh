#!/bin/bash
# Starts the Google Search Console MCP server.
# If GOOGLE_APPLICATION_CREDENTIALS is not set but the secret
# GSC_SERVICE_ACCOUNT_JSON is (cloud environment), the key is written to a
# private file outside the repo and used from there.
set -euo pipefail

if [ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ] && [ -n "${GSC_SERVICE_ACCOUNT_JSON:-}" ]; then
  key_dir="${HOME}/.config/gsc"
  key_file="${key_dir}/sa.json"
  umask 077
  mkdir -p "$key_dir"
  printf '%s' "$GSC_SERVICE_ACCOUNT_JSON" > "$key_file"
  chmod 600 "$key_file"
  export GOOGLE_APPLICATION_CREDENTIALS="$key_file"
fi

export DO_NOT_TRACK=1
export GSC_MCP_TELEMETRY=false

exec uvx google-search-console-mcp@0.10.9
