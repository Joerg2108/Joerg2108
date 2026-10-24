#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Back Office – Installation auf einem frischen Server (Ubuntu 22.04/24.04, Debian 12)
#
#  Aufruf (im entpackten Back-Office-Ordner):
#    sudo bash deploy/install.sh --domain office.joerg-noack.com --email info@joerg-noack.com
#
#  Optionen:
#    --domain  DOMAIN      Adresse des Back Office (DNS-A-Record muss auf diesen Server zeigen)
#    --email   E-MAIL      Login des Administrators und Kontakt für das HTTPS-Zertifikat
#    --website URL[,URL]   Website(s), die Kontaktformular/Leistungskatalog nutzen
#                          (Standard: https://joerg-noack.com,https://www.joerg-noack.com)
#    --skip-dns-check      DNS-Prüfung überspringen
#    --no-firewall         Firewall (ufw) nicht einrichten
#    --yes                 keine Rückfragen
#
#  Erneut ausführbar: vorhandene Daten (/var/lib/backoffice) und .env bleiben erhalten.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR=/opt/backoffice
DATA_DIR=/var/lib/backoffice
APP_USER=backoffice
PORT=3000
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DOMAIN=""; EMAIL=""; WEBSITES="https://joerg-noack.com,https://www.joerg-noack.com"
DNS_CHECK=1; FIREWALL=1; ASSUME_YES=0

say()  { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m✔ %s\033[0m\n' "$*"; }
warn() { printf '  \033[33m⚠ %s\033[0m\n' "$*"; }
die()  { printf '\n\033[31m✖ %s\033[0m\n' "$*" >&2; exit 1; }
confirm() {
  [[ $ASSUME_YES == 1 ]] && return 0
  read -rp "  $1 [j/N] " a; [[ $a =~ ^[jJyY] ]]
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    --website) WEBSITES="$2"; shift 2 ;;
    --skip-dns-check) DNS_CHECK=0; shift ;;
    --no-firewall) FIREWALL=0; shift ;;
    --yes|-y) ASSUME_YES=1; shift ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) die "Unbekannte Option: $1 (Hilfe: --help)" ;;
  esac
done

# ───────── Vorprüfungen ─────────
[[ $EUID -eq 0 ]] || die "Bitte mit sudo bzw. als root ausführen."
[[ -f "$SRC_DIR/package.json" && -f "$SRC_DIR/src/server.js" ]] || die "Bitte aus dem entpackten Back-Office-Ordner starten (package.json nicht gefunden)."
. /etc/os-release
[[ "$ID" == "ubuntu" || "$ID" == "debian" ]] || die "Unterstützt werden Ubuntu und Debian (gefunden: $PRETTY_NAME)."
command -v systemctl >/dev/null && [[ -d /run/systemd/system ]] || die "systemd wird benötigt."

[[ -n "$DOMAIN" ]] || read -rp "Domain für das Back Office (z. B. office.joerg-noack.com): " DOMAIN
[[ -n "$EMAIL"  ]] || read -rp "E-Mail-Adresse des Administrators: " EMAIL
[[ "$DOMAIN" =~ ^[a-zA-Z0-9.-]+$ ]] || die "Ungültige Domain: $DOMAIN"
[[ "$EMAIL" =~ ^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$ ]] || die "Ungültige E-Mail: $EMAIL"

echo
echo "  Back Office wird installiert:"
echo "    Adresse:   https://$DOMAIN"
echo "    Admin:     $EMAIL"
echo "    Websites:  $WEBSITES"
echo "    Programm:  $APP_DIR    Daten: $DATA_DIR"
confirm "Fortfahren?" || die "Abgebrochen."

export DEBIAN_FRONTEND=noninteractive

# ───────── Systempakete ─────────
say "Systempakete installieren"
apt-get update -qq
apt-get install -y -qq curl ca-certificates gnupg rsync ufw debian-keyring debian-archive-keyring apt-transport-https unattended-upgrades dnsutils >/dev/null
ok "Basispakete"

# Automatische Sicherheitsupdates des Betriebssystems
echo 'APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";' > /etc/apt/apt.conf.d/20auto-upgrades
ok "Automatische Sicherheitsupdates aktiv"

# ───────── DNS-Prüfung ─────────
if [[ $DNS_CHECK == 1 ]]; then
  say "DNS prüfen"
  SERVER_IP="$(curl -4fsS --max-time 10 https://api.ipify.org 2>/dev/null || curl -4fsS --max-time 10 https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
  DNS_IP="$(dig +short A "$DOMAIN" | tail -n1 || true)"
  if [[ -n "$SERVER_IP" && "$SERVER_IP" == "$DNS_IP" ]]; then
    ok "$DOMAIN zeigt auf diesen Server ($SERVER_IP)"
  else
    warn "$DOMAIN zeigt auf '${DNS_IP:-nichts}', dieser Server hat '${SERVER_IP:-unbekannt}'."
    warn "Ohne korrekten A-Record kann kein HTTPS-Zertifikat ausgestellt werden."
    warn "Lege beim Domain-Anbieter einen A-Record '$DOMAIN → $SERVER_IP' an (Wirkung nach Minuten bis Stunden)."
    confirm "Trotzdem fortfahren? (Zertifikat wird automatisch nachgeholt, sobald DNS stimmt)" || die "Abgebrochen."
  fi
fi

# ───────── Node.js 22 ─────────
say "Node.js installieren"
NODE_OK=0
if command -v node >/dev/null; then
  node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=5)?0:1)' && NODE_OK=1
fi
# Offizielles Node.js-Archiv von nodejs.org (Prüfsumme wird kontrolliert) – Ausweichweg, falls NodeSource nicht erreichbar ist
install_node_tarball() {
  local arch ver tmp
  case "$(uname -m)" in x86_64) arch=x64 ;; aarch64|arm64) arch=arm64 ;; *) die "Nicht unterstützte Architektur: $(uname -m)" ;; esac
  ver="$(curl -fsSL https://nodejs.org/dist/index.json | grep -o '"version":"v22\.[0-9]*\.[0-9]*"' | head -n1 | cut -d'"' -f4)"
  [[ -n "$ver" ]] || die "Node.js-Version konnte nicht ermittelt werden."
  tmp="$(mktemp -d)"
  curl -fsSL -o "$tmp/node.tar.xz" "https://nodejs.org/dist/$ver/node-$ver-linux-$arch.tar.xz"
  curl -fsSL -o "$tmp/SHASUMS256.txt" "https://nodejs.org/dist/$ver/SHASUMS256.txt"
  (cd "$tmp" && grep " node-$ver-linux-$arch.tar.xz\$" SHASUMS256.txt | sed "s#node-$ver-linux-$arch.tar.xz#node.tar.xz#" | sha256sum -c --quiet) || die "Prüfsumme von Node.js stimmt nicht – Abbruch."
  tar -xJf "$tmp/node.tar.xz" -C /usr/local --strip-components=1
  rm -rf "$tmp"
}
if [[ $NODE_OK == 0 ]]; then
  if curl -fsSL --max-time 30 https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh 2>/dev/null && bash /tmp/nodesource_setup.sh >/dev/null 2>&1; then
    apt-get install -y -qq nodejs >/dev/null
  else
    warn "NodeSource nicht erreichbar – installiere offizielles Archiv von nodejs.org"
    apt-get install -y -qq xz-utils >/dev/null
    install_node_tarball
  fi
  rm -f /tmp/nodesource_setup.sh
fi
hash -r
NODE_BIN="$(command -v node)"
ok "Node.js $(node -v) ($NODE_BIN)"

# ───────── Benutzer, Programm, Daten ─────────
say "Programm einrichten"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
mkdir -p "$APP_DIR" "$DATA_DIR"
rsync -a --delete --exclude node_modules --exclude data --exclude .env --exclude dist --exclude tests --exclude .git "$SRC_DIR/" "$APP_DIR/"
cd "$APP_DIR"
npm ci --omit=dev --no-audit --no-fund --loglevel=error
chown -R root:root "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$DATA_DIR"
chmod 750 "$DATA_DIR"
ok "Programm in $APP_DIR, Daten in $DATA_DIR"

# ───────── Konfiguration (.env) ─────────
FIRST_INSTALL=0
ADMIN_PASSWORD=""
if [[ ! -f "$APP_DIR/.env" ]]; then
  FIRST_INSTALL=1
  SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")"
  # Gut abtippbares Startpasswort (ohne verwechselbare Zeichen wie 0/O, 1/l), erfüllt die Passwortregeln
  ADMIN_PASSWORD="$(node -e "const c=require('crypto');const a='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';let p='';for(const b of c.randomBytes(14))p+=a[b%a.length];console.log(p.slice(0,4)+'-'+p.slice(4,8)+'-'+p.slice(8,12)+'-Ab7')")"
  cat > "$APP_DIR/.env" <<EOF
# Back Office – erzeugt von install.sh am $(date '+%d.%m.%Y %H:%M')
NODE_ENV=production
HOST=127.0.0.1
PORT=$PORT
BASE_URL=https://$DOMAIN
TRUST_PROXY=1
SESSION_SECRET=$SECRET
DATA_DIR=$DATA_DIR
ADMIN_EMAIL=$EMAIL
ADMIN_NAME=Administrator
ADMIN_PASSWORD=$ADMIN_PASSWORD
CORS_ORIGINS=$WEBSITES
MAX_UPLOAD_MB=20
BACKUP_KEEP=30

# E-Mail-Versand (Rechnungen, Passwort-Reset) – Zugangsdaten deines Mail-Anbieters eintragen,
# danach:  sudo systemctl restart backoffice
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
EOF
  ok ".env angelegt (neuer Sitzungsschlüssel)"
else
  ok ".env vorhanden – bleibt unverändert"
fi
chown root:"$APP_USER" "$APP_DIR/.env"
chmod 640 "$APP_DIR/.env"

# ───────── Dienst (systemd) ─────────
say "Dienst einrichten"
cat > /etc/systemd/system/backoffice.service <<EOF
[Unit]
Description=Back Office
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=$NODE_BIN --no-warnings src/server.js
Restart=always
RestartSec=5
# Härtung: nur das Datenverzeichnis ist beschreibbar
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
ReadWritePaths=$DATA_DIR

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now backoffice >/dev/null 2>&1
systemctl restart backoffice

for i in $(seq 1 30); do
  curl -fsS "http://127.0.0.1:$PORT/healthz" >/dev/null 2>&1 && break
  sleep 1
done
curl -fsS "http://127.0.0.1:$PORT/healthz" >/dev/null || { journalctl -u backoffice -n 30 --no-pager; die "Back Office startet nicht (Log oben)."; }
ok "Back Office läuft (Port $PORT, nur lokal erreichbar)"

# Admin-Passwort nach dem ersten Start wieder aus der .env entfernen
if [[ $FIRST_INSTALL == 1 ]]; then
  sed -i 's/^ADMIN_PASSWORD=.*/ADMIN_PASSWORD=/' "$APP_DIR/.env"
fi

# ───────── Caddy (HTTPS) ─────────
say "HTTPS mit Caddy einrichten"
if ! command -v caddy >/dev/null; then
  # Bevorzugt: offizielles Caddy-Repository (aktuellste Version); sonst Paket der Distribution
  if curl -1sLf --max-time 30 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' -o /tmp/caddy.key 2>/dev/null; then
    gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg /tmp/caddy.key
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -qq
  else
    warn "Caddy-Repository nicht erreichbar – verwende Caddy aus den Paketquellen von $PRETTY_NAME"
  fi
  rm -f /tmp/caddy.key
  apt-get install -y -qq caddy >/dev/null
fi
cat > /etc/caddy/Caddyfile <<EOF
# Back Office – erzeugt von install.sh
{
	email $EMAIL
}

$DOMAIN {
	encode zstd gzip
	request_body {
		max_size 25MB
	}
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		-Server
	}
	reverse_proxy 127.0.0.1:$PORT
}
EOF
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1 || die "Caddyfile ungültig."
systemctl enable --now caddy >/dev/null 2>&1
systemctl reload caddy || systemctl restart caddy
ok "Caddy aktiv – Zertifikat von Let's Encrypt wird automatisch geholt und erneuert"

# ───────── Firewall ─────────
if [[ $FIREWALL == 1 ]]; then
  say "Firewall einrichten"
  ufw allow OpenSSH >/dev/null
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
  ufw --force enable >/dev/null
  ok "Offen: SSH, 80, 443 – alles andere gesperrt"
fi

# ───────── Zusammenfassung ─────────
ZUGANG=/root/backoffice-zugang.txt
if [[ $FIRST_INSTALL == 1 ]]; then
  umask 077
  cat > "$ZUGANG" <<EOF
Back Office – Zugangsdaten (Erstinstallation $(date '+%d.%m.%Y %H:%M'))
Adresse:  https://$DOMAIN
E-Mail:   $EMAIL
Passwort: $ADMIN_PASSWORD
→ Nach dem ersten Login: Passwort ändern und 2FA aktivieren (Profil). Danach diese Datei löschen.
EOF
fi

cat <<EOF

────────────────────────────────────────────────────────────
  ✅ Back Office ist installiert:  https://$DOMAIN
EOF
if [[ $FIRST_INSTALL == 1 ]]; then
cat <<EOF

  Erster Login
    E-Mail:   $EMAIL
    Passwort: $ADMIN_PASSWORD
    (auch gespeichert in $ZUGANG – nach dem ersten Login löschen)
EOF
fi
cat <<EOF

  Nächste Schritte
    1. Einloggen, Passwort ändern, 2FA aktivieren (Profil)
    2. Einstellungen → Firma, Bank & Steuern, Logo
    3. Artikel & Leistungen → „Leistungskatalog einspielen“
    4. SMTP in $APP_DIR/.env eintragen → sudo systemctl restart backoffice
    5. API & Website → Code für Kontaktformular und Leistungen auf joerg-noack.com einbauen

  Nützliche Befehle
    Status:   systemctl status backoffice
    Log:      journalctl -u backoffice -f
    Neustart: sudo systemctl restart backoffice
    Update:   neues Paket entpacken → sudo bash deploy/update.sh
    Backups:  $DATA_DIR/backups (täglich automatisch)
────────────────────────────────────────────────────────────
EOF
