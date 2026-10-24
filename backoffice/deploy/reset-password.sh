#!/usr/bin/env bash
# Notfall-Passwort für einen Benutzer setzen (deaktiviert auch 2FA und hebt Sperren auf)
#   sudo bash /opt/backoffice/deploy/reset-password.sh info@joerg-noack.com
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Bitte mit sudo ausführen."; exit 1; }
[[ -n "${1:-}" ]] || { echo "Aufruf: sudo bash $0 <E-Mail>"; exit 1; }
cd /opt/backoffice
# E-Mail als Argument übergeben (nicht in den Befehl einsetzen) – schützt vor Sonderzeichen
sudo -u backoffice bash -c 'set -a; . /opt/backoffice/.env; set +a; exec node --no-warnings src/lib/reset-password-cli.js "$0"' "$1"
