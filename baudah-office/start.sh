#!/usr/bin/env bash
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node.js (>= 22.5) fehlt: https://nodejs.org"; exit 1; }
[ -d node_modules ] || npm install --omit=dev
node server.js
