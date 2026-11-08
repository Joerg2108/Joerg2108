#!/usr/bin/env bash
# Richtet den Instagram-Agenten auf einem Linux-Server (Debian/Ubuntu) ein – z. B. auf dem VPS mit dem Back Office.
# Aufruf aus dem Ordner marketing/insta-agent:   sudo bash deploy/einrichten.sh
# Erneut ausführen = Update (Konfiguration, Warteschlange und Verlauf bleiben erhalten).
set -euo pipefail

APP_DIR=/opt/insta-agent
DATA_DIR=/var/lib/insta-agent
ENV_FILE=/etc/insta-agent.env
APP_USER=insta-agent
QUELLE="$(cd "$(dirname "$0")/.." && pwd)"

ok()  { echo -e "\e[32m✔\e[0m $*"; }
die() { echo -e "\e[31m✘ $*\e[0m" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Bitte mit sudo ausführen."
command -v node >/dev/null || die "Node.js fehlt. Installieren (≥ 20), z. B.: curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs"
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$NODE_MAJOR" -ge 20 ] || die "Node.js $NODE_MAJOR ist zu alt, mindestens 20 nötig."

# 1. Benutzer und Ordner
id "$APP_USER" >/dev/null 2>&1 || useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
mkdir -p "$APP_DIR" "$DATA_DIR/ausgabe" "$DATA_DIR/public"
chown -R "$APP_USER:$APP_USER" "$DATA_DIR"
chmod 755 "$DATA_DIR" "$DATA_DIR/public"   # Webserver muss die Bilder lesen dürfen
ok "Benutzer $APP_USER und Ordner angelegt"

# 2. Programm kopieren (ohne lokale Daten und Geheimnisse)
tar -C "$QUELLE" --exclude=node_modules --exclude=ausgabe --exclude=.env --exclude=warteschlange.txt -cf - . | tar -C "$APP_DIR" -xf -
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
ok "Programm nach $APP_DIR kopiert"

# 3. Abhängigkeiten + Chromium für das Rendern
cd "$APP_DIR"
sudo -u "$APP_USER" npm ci --omit=dev --no-audit --no-fund --loglevel=error
npx --yes playwright install-deps chromium >/dev/null
sudo -u "$APP_USER" env PLAYWRIGHT_BROWSERS_PATH="$APP_DIR/browsers" npx playwright install chromium >/dev/null
ok "Abhängigkeiten und Chromium installiert"

# 4. Konfiguration (nur beim ersten Mal anlegen)
if [ ! -f "$ENV_FILE" ]; then
  cp "$APP_DIR/.env.beispiel" "$ENV_FILE"
  sed -i "s|^BILD_ORDNER=.*|BILD_ORDNER=$DATA_DIR/public|" "$ENV_FILE"
  NEU_ENV=1
fi
chown root:"$APP_USER" "$ENV_FILE"
chmod 640 "$ENV_FILE"
[ -f "$DATA_DIR/warteschlange.txt" ] || install -o "$APP_USER" -g "$APP_USER" -m 644 "$APP_DIR/warteschlange.beispiel.txt" "$DATA_DIR/warteschlange.txt"
ok "Konfiguration: $ENV_FILE · Themen: $DATA_DIR/warteschlange.txt"

# 5. Zeitplan
install -m 644 "$APP_DIR/deploy/insta-agent@.service" "$APP_DIR/deploy/insta-agent-feed.timer" "$APP_DIR/deploy/insta-agent-story.timer" /etc/systemd/system/
install -m 755 "$APP_DIR/deploy/insta-agent" /usr/local/bin/insta-agent
systemctl daemon-reload
ok "systemd-Units und Befehl „insta-agent“ installiert"

echo
if [ "${NEU_ENV:-}" = 1 ]; then
  cat <<EOF
Nächste Schritte:
  1. Zugangsdaten eintragen:        sudo nano $ENV_FILE
  2. Bilder öffentlich machen – in /etc/caddy/Caddyfile im Block deiner Domain ergänzen:

       handle_path /insta/* {
           root * $DATA_DIR/public
           file_server
       }

     (die bestehende Zeile „reverse_proxy …“ in  handle { … }  einpacken), dann:  sudo systemctl reload caddy
  3. Einrichtung testen:            sudo insta-agent --pruefen
  4. Probelauf ohne Posten:         sudo insta-agent --trocken
  5. Automatik einschalten:         sudo systemctl enable --now insta-agent-feed.timer insta-agent-story.timer
EOF
else
  systemctl list-timers 'insta-agent*' --no-pager || true
  ok "Update fertig."
fi
