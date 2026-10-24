#!/usr/bin/env bash
# Erstellt ein Installationspaket: dist/backoffice-<version>.tar.gz
# (ohne node_modules, Daten, .env und Tests – wird auf dem Server per deploy/install.sh installiert)
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
VERSION="$(node -p "require('./package.json').version")"
NAME="backoffice-$VERSION"
mkdir -p dist
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/$NAME"
tar -c --exclude=./node_modules --exclude=./data --exclude=./.env --exclude=./dist --exclude=./tests --exclude=./.git . | tar -x -C "$TMP/$NAME"
chmod +x "$TMP/$NAME/deploy/"*.sh
tar -C "$TMP" -czf "dist/$NAME.tar.gz" "$NAME"
echo "Paket erstellt: dist/$NAME.tar.gz ($(du -h "dist/$NAME.tar.gz" | cut -f1))"
