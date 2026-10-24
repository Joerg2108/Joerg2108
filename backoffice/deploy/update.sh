#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Back Office – Update auf eine neue Version
#
#  1. Neues Paket hochladen und entpacken, z. B.:  tar xzf backoffice-1.1.0.tar.gz
#  2. Im entpackten Ordner:                         sudo bash deploy/update.sh
#
#  Ablauf: Backup → alte Version sichern → neue Version einspielen → Neustart → Prüfung.
#  Startet die neue Version nicht, wird automatisch die alte wiederhergestellt.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR=/opt/backoffice
DATA_DIR=/var/lib/backoffice
APP_USER=backoffice
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ok()  { printf '  \033[32m✔ %s\033[0m\n' "$*"; }
die() { printf '\n\033[31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Bitte mit sudo ausführen."
[[ -f "$APP_DIR/.env" ]] || die "Keine Installation in $APP_DIR gefunden – bitte zuerst deploy/install.sh ausführen."
[[ "$SRC_DIR" != "$APP_DIR" ]] || die "Bitte aus dem entpackten NEUEN Paket starten, nicht aus $APP_DIR."
PORT="$(grep -E '^PORT=' "$APP_DIR/.env" | cut -d= -f2)"; PORT="${PORT:-3000}"
OLD_VERSION="$(node -p "require('$APP_DIR/package.json').version")"
NEW_VERSION="$(node -p "require('$SRC_DIR/package.json').version")"
echo "Update $OLD_VERSION → $NEW_VERSION"

# 1. Datensicherung
sudo -u "$APP_USER" bash -c "set -a; . '$APP_DIR/.env'; set +a; cd '$APP_DIR' && node --no-warnings src/lib/backup-cli.js" >/dev/null
ok "Backup erstellt ($DATA_DIR/backups)"

# 2. Alte Version aufheben
rm -rf "$APP_DIR.prev"
cp -a "$APP_DIR" "$APP_DIR.prev"
ok "Vorherige Version gesichert ($APP_DIR.prev)"

# 3. Neue Version einspielen (.env und Daten bleiben unberührt)
rsync -a --delete --exclude node_modules --exclude data --exclude .env --exclude dist --exclude tests --exclude .git "$SRC_DIR/" "$APP_DIR/"
cd "$APP_DIR"
npm ci --omit=dev --no-audit --no-fund --loglevel=error
chown -R root:root "$APP_DIR"
chown root:"$APP_USER" "$APP_DIR/.env"
ok "Version $NEW_VERSION eingespielt"

# 4. Neustart & Prüfung, bei Fehler zurückrollen
systemctl restart backoffice
for i in $(seq 1 30); do curl -fsS "http://127.0.0.1:$PORT/healthz" >/dev/null 2>&1 && break; sleep 1; done
if ! curl -fsS "http://127.0.0.1:$PORT/healthz" >/dev/null 2>&1; then
  journalctl -u backoffice -n 30 --no-pager || true
  rm -rf "$APP_DIR" && mv "$APP_DIR.prev" "$APP_DIR"
  systemctl restart backoffice
  for i in $(seq 1 30); do curl -fsS "http://127.0.0.1:$PORT/healthz" >/dev/null 2>&1 && break; sleep 1; done
  if curl -fsS "http://127.0.0.1:$PORT/healthz" >/dev/null 2>&1; then
    die "Neue Version startet nicht – alte Version $OLD_VERSION wurde wiederhergestellt und läuft wieder."
  fi
  die "Neue Version startet nicht und auch die alte Version läuft nicht an. Datenbank-Backup: $DATA_DIR/backups – Log: journalctl -u backoffice -n 50"
fi
ok "Back Office $NEW_VERSION läuft"
