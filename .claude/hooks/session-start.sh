#!/bin/bash
# Cloud sessions only: pre-install the pinned Google Search Console MCP
# server so its first start does not wait for PyPI. The container is cached
# after this hook, so later sessions start without the download.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

DO_NOT_TRACK=1 GSC_MCP_TELEMETRY=false \
  uvx --from google-search-console-mcp==0.10.9 python -c "import gsc_mcp_server" >/dev/null 2>&1 \
  || echo "session-start: could not pre-install google-search-console-mcp (it will install on first use)" >&2
