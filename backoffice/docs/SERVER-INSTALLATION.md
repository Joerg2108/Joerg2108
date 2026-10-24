# Back Office auf deinem Server – Schritt für Schritt

Diese Anleitung bringt das Back Office auf einen eigenen Server unter **https://office.joerg-noack.com**. Du brauchst keine Linux-Vorkenntnisse; jeden Befehl kannst du einfach kopieren. Rechne mit etwa **30–45 Minuten**, die meiste Zeit davon wartest du auf den DNS-Eintrag.

---

## Überblick

```
 Besucher ──► joerg-noack.com (deine Website)
                 │  Kontaktformular & Leistungskatalog
                 ▼
 Du ───────► office.joerg-noack.com  ──►  dein Server (VPS)
               HTTPS (Caddy)               Back Office + Datenbank + Backups
```

1. Server mieten
2. DNS-Eintrag anlegen
3. Paket hochladen
4. Installer starten
5. Einrichten (Firma, E-Mail, Website)

---

## 1. Server mieten

Ein kleiner virtueller Server (VPS) reicht völlig aus.

| Empfehlung | Wert |
|---|---|
| Betriebssystem | **Ubuntu 24.04** (alternativ Ubuntu 22.04 oder Debian 12) |
| Größe | 2 vCPU, **2–4 GB RAM**, 20 GB+ SSD (der kleinste Tarif der meisten Anbieter genügt) |
| Standort | **Deutschland** (DSGVO, kurze Wege) |
| Anbieter (Beispiele) | Hetzner Cloud, netcup, IONOS, Strato. Kosten: meist wenige Euro im Monat |

Beim Bestellen:
- **SSH-Schlüssel** hinterlegen (sicherer als ein Passwort, siehe Kasten).
- Falls angeboten: **Backups/Snapshots** des Anbieters aktivieren. Das ist eine zweite Sicherung zusätzlich zu den eingebauten.
- Den **Auftragsverarbeitungsvertrag (AVV, Art. 28 DSGVO)** im Kundenkonto des Anbieters abschließen. Das ist meist ein Klick, und du brauchst ihn, weil Kundendaten auf dem Server liegen.

> **SSH-Schlüssel erstellen** (einmalig auf deinem PC)
> Windows: PowerShell öffnen · Mac/Linux: Terminal öffnen
> ```bash
> ssh-keygen -t ed25519
> ```
> Dreimal Enter drücken. Den Inhalt der Datei `C:\Users\<Name>\.ssh\id_ed25519.pub` (Mac: `~/.ssh/id_ed25519.pub`) beim Anbieter als SSH-Key einfügen.

Nach der Bestellung bekommst du die **IP-Adresse** des Servers, z. B. `203.0.113.10`.

---

## 2. DNS-Eintrag anlegen

Melde dich dort an, wo **joerg-noack.com** registriert ist (z. B. IONOS, Strato, United Domains), und lege in der DNS-Verwaltung diesen Eintrag an:

| Typ | Name / Host | Wert / Ziel | TTL |
|---|---|---|---|
| **A** | `office` | IP deines Servers (z. B. `203.0.113.10`) | Standard |

Bis der Eintrag gilt, dauert es meist wenige Minuten, manchmal einige Stunden. Prüfen kannst du es so:

```bash
nslookup office.joerg-noack.com
```

Wenn dort die IP deines Servers steht, geht es weiter.

> ⚠️ Beim Erstellen der Software war **joerg-noack.com** selbst per DNS nicht erreichbar. Prüfe in der DNS-Verwaltung, ob auch die Einträge für deine Website (`@` und `www`) stimmen.

---

## 3. Paket hochladen

Die Datei `backoffice-1.0.0.tar.gz` (Installationspaket) kopierst du auf den Server. Im Terminal bzw. in der PowerShell, im Ordner der Datei:

```bash
scp backoffice-1.0.0.tar.gz root@203.0.113.10:/root/
```

Statt `203.0.113.10` setzt du deine IP ein. Unter Windows geht es alternativ per Drag & Drop mit **WinSCP**.

---

## 4. Installer starten

Mit dem Server verbinden:

```bash
ssh root@203.0.113.10
```

Paket entpacken und Installer starten. Domain und E-Mail passt du an:

```bash
cd /root
tar xzf backoffice-1.0.0.tar.gz
cd backoffice-1.0.0
bash deploy/install.sh --domain office.joerg-noack.com --email info@joerg-noack.com
```

Der Installer fragt einmal „Fortfahren?“, das bestätigst du mit **j**. Danach läuft alles automatisch (3–5 Minuten):

- ✔ Systempakete & automatische Sicherheitsupdates
- ✔ DNS-Prüfung
- ✔ Node.js
- ✔ Back Office als Dienst (startet nach jedem Neustart automatisch)
- ✔ HTTPS-Zertifikat (Caddy + Let's Encrypt, Verlängerung automatisch)
- ✔ Firewall (nur SSH, HTTP, HTTPS)

Am Ende stehen da **Adresse, E-Mail und Startpasswort**. Das Passwort steht auch in `/root/backoffice-zugang.txt`.

---

## 5. Einrichten

Öffne **https://office.joerg-noack.com** und melde dich an.

1. **Profil → Passwort ändern** und **2FA aktivieren**. Danach auf dem Server die Zugangsdatei löschen: `rm /root/backoffice-zugang.txt`
2. **Einstellungen → Firma / Bank & Steuern / Design**: Firmendaten, IBAN, Steuernummer, Logo
3. **Artikel & Leistungen → „Leistungskatalog einspielen“** und die Preise prüfen
4. **E-Mail-Versand** einrichten, damit Rechnungen, Passwort-Reset und Benachrichtigungen per Mail gehen:
   ```bash
   nano /opt/backoffice/.env
   ```
   Die Zeilen `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` mit den Daten deines Mail-Postfachs ausfüllen. Die Werte stehen beim Mail-Anbieter unter „SMTP“, z. B. IONOS `smtp.ionos.de`, Port 587. Speichern mit `Strg+O`, `Enter`, `Strg+X`. Danach:
   ```bash
   systemctl restart backoffice
   ```
   Testen kannst du unter **Einstellungen → System → Testmail senden**.
5. **API & Website**: die beiden Code-Schnipsel (Kontaktformular und Leistungskatalog) auf joerg-noack.com einbauen.

---

## Alltag: Befehle für den Server

| Aufgabe | Befehl |
|---|---|
| Läuft alles? | `systemctl status backoffice` |
| Live-Protokoll ansehen | `journalctl -u backoffice -f` (Beenden mit `Strg+C`) |
| Neu starten | `systemctl restart backoffice` |
| Passwort vergessen (Notfall) | `bash /opt/backoffice/deploy/reset-password.sh info@joerg-noack.com` |
| Backups ansehen | `ls -lh /var/lib/backoffice/backups` |
| Speicherplatz | `df -h /` |

---

## Updates einspielen

Neues Paket hochladen (Schritt 3) und auf dem Server ausführen:

```bash
cd /root && tar xzf backoffice-1.1.0.tar.gz && cd backoffice-1.1.0
bash deploy/update.sh
```

Das Update macht vorher **automatisch ein Backup** und hebt die alte Version auf. Startet die neue Version nicht, stellt es **die alte automatisch wieder her**.

---

## Datensicherung

- **Automatisch:** Das Back Office sichert die Datenbank täglich nach `/var/lib/backoffice/backups` und behält die letzten 30 Stände.
- **Zusätzlich extern sichern (wichtig!):** Ein Server kann ausfallen. Mindestens eine dieser Möglichkeiten nutzen:
  - **Snapshots/Backups beim Anbieter** aktivieren (einfachste Lösung)
  - **Backups herunterladen:** im Back Office unter **Verwaltung → Backups**
  - **Automatisch auf einen zweiten Rechner/NAS kopieren**, z. B. täglich um 3:15 Uhr:
    ```bash
    echo '15 3 * * * root rsync -a /var/lib/backoffice/ backup@mein-nas:/backups/backoffice/' > /etc/cron.d/backoffice-offsite
    ```

**Wiederherstellen:**
```bash
systemctl stop backoffice
cp /var/lib/backoffice/backups/backup-<datum>.sqlite /var/lib/backoffice/backoffice.sqlite
rm -f /var/lib/backoffice/backoffice.sqlite-wal /var/lib/backoffice/backoffice.sqlite-shm
chown backoffice:backoffice /var/lib/backoffice/backoffice.sqlite
systemctl start backoffice
```

---

## Wenn etwas nicht klappt

| Problem | Lösung |
|---|---|
| Browser meldet „Verbindung nicht sicher“ / kein Zertifikat | DNS zeigt noch nicht auf den Server (Schritt 2). Prüfen mit `nslookup office.joerg-noack.com`. Caddy holt das Zertifikat automatisch nach, sobald DNS stimmt, oder sofort mit `systemctl restart caddy`. Log: `journalctl -u caddy -n 50` |
| Seite nicht erreichbar | `systemctl status backoffice caddy`, Firewall: `ufw status` |
| Login gesperrt (zu viele Versuche) | 15 Minuten warten oder Notfall-Passwort setzen (siehe oben) |
| Mails kommen nicht an | SMTP-Daten in `/opt/backoffice/.env` prüfen, `systemctl restart backoffice`, Testmail senden, Log ansehen |
| Website zeigt Leistungen/Formular nicht | Unter **API & Website** prüfen, ob die Website-Adresse in `CORS_ORIGINS` (`/opt/backoffice/.env`) steht. Nach Änderung `systemctl restart backoffice` |

---

## Sicherheit – was der Installer schon erledigt

- HTTPS mit automatisch erneuertem Zertifikat, HSTS
- Firewall: nur Ports 22, 80, 443 offen; das Back Office selbst ist nur lokal erreichbar
- Eigener Systembenutzer ohne Login; Schreibrechte nur auf das Datenverzeichnis
- Automatische Sicherheitsupdates des Betriebssystems
- Zufälliger Sitzungsschlüssel, Passwort-Hashing (bcrypt), 2FA, Sperre nach Fehlversuchen, Audit-Log

**Empfehlung:** Nach dem ersten Login per SSH-Schlüssel kannst du die Passwort-Anmeldung per SSH abschalten:
```bash
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config && systemctl restart ssh
```
> Nur ausführen, wenn der Login per SSH-Schlüssel sicher funktioniert! Sonst sperrst du dich aus. Im Notfall hilft die Web-Konsole deines Anbieters.
