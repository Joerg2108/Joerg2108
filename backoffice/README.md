# Back Office für joerg-noack.com

Komplette, selbst gehostete Verwaltungssoftware für Dienstleister und kleine Unternehmen: **CRM, Website-Anfragen, Angebote, Aufträge, Rechnungen inkl. E-Rechnung (XRechnung), Mahnwesen, Abos, Projekte, Aufgaben, Kalender, Zeiterfassung, Ausgaben, Dokumente, Berichte und DATEV-Export**, mit Rollen, 2FA, Audit-Log und automatischen Backups.

Die Oberfläche ist komplett auf Deutsch, funktioniert auf Smartphones und kennt einen Hell- und einen Dunkelmodus. Name, Logo und Markenfarbe stellst du in den Einstellungen ein (White-Label).

---

## Inhalt

1. [Funktionsumfang](#funktionsumfang)
2. [Schnellstart](#schnellstart)
3. [Produktivbetrieb](#produktivbetrieb-server)
4. [Website anbinden](#website-anbinden-kontaktformular)
5. [Rollen & Rechte](#rollen--rechte)
6. [Rechtliches: GoBD, UStG, DSGVO](#rechtliches-gobd-ustg-dsgvo)
7. [Backup & Wiederherstellung](#backup--wiederherstellung)
8. [REST-API](#rest-api)
9. [Technik & Architektur](#technik--architektur)
10. [Entwicklung & Tests](#entwicklung--tests)

---

## Funktionsumfang

| Bereich | Funktionen |
|---|---|
| **Dashboard** | KPIs (Umsatz, offene/überfällige Posten, Angebote, Pipeline, Stunden), 12-Monats-Diagramm Umsatz vs. Ausgaben, Aufgaben, Termine, neue Anfragen |
| **Anfragen / Vertrieb** | Kanban-Board mit Drag & Drop, Website-Kontaktformular als Quelle, Notizen und Anrufe als Verlauf, Auftragswert, Zuständigkeit, Übernahme als Kunde mit einem Klick, Abschlussquote |
| **Kunden (CRM)** | Firmen, Privatkunden und Behörden, Ansprechpartner, Kontakthistorie, Tags, Zahlungsziel und Rabatt pro Kunde, Leitweg-ID, CSV-Import (erkennt deutsche Spaltennamen) und CSV-Export, DSGVO-Auskunft (JSON) und Anonymisierung |
| **Angebote → AB → Rechnung** | Positionseditor mit Live-Summen, Artikelkatalog, Rabatte, 19/7/0 % USt, Umwandeln per Klick, Duplizieren, Statusverfolgung |
| **Rechnungen** | Lückenlose Nummernkreise pro Jahr, Festschreiben nach GoBD (danach in der Datenbank gesperrt), Pflichtangaben nach § 14 UStG, Leistungszeitraum, Teilzahlungen, Stornorechnung, Reverse Charge, Kleinunternehmerregelung § 19 UStG |
| **E-Rechnung** | Export als XRechnung 3.0 (UBL, EN 16931) für Behörden und B2B, optional als Mail-Anhang |
| **PDF** | Layout nach DIN 5008 (passt in Fensterumschläge), Logo, Fußzeile mit Firmen- und Bankdaten, **GiroCode (EPC-QR)** zum Bezahlen per Banking-App, Wasserzeichen „ENTWURF“ |
| **Mahnwesen** | 3 Mahnstufen mit eigenen Texten, Gebühren und Fristen, Mahn-PDFs mit QR-Code, Übersicht aller überfälligen Rechnungen |
| **Abos & Verträge** | Wiederkehrende Rechnungen (monatlich, quartalsweise, halbjährlich, jährlich), optional automatisch festschreiben |
| **E-Mail-Versand** | Belege direkt per SMTP verschicken, Vorlagen mit Platzhaltern, Benachrichtigung bei neuen Website-Anfragen |
| **Projekte** | Budget mit Fortschrittsbalken, Stundensatz, Aufgaben, Zeiten, Dateien, Deckungsbeitrag, **offene Zeiten mit einem Klick abrechnen** |
| **Aufgaben** | Kanban (offen, in Arbeit, wartet, erledigt), Prioritäten, Fälligkeiten, Zuweisung mit Benachrichtigung |
| **Kalender** | Monatsansicht mit Terminen, fälligen Aufgaben und fälligen Rechnungen, **iCal-Abo für Outlook, Google und iPhone** |
| **Dienstplanung** | Wochenplan je Mitarbeiter mit offenen Schichten, Schichten über Mitternacht, Serien (z. B. Mo–Fr bis Datum), Woche kopieren, Status (geplant/bestätigt/erledigt/abgesagt), PDF im Querformat, Versand des persönlichen Plans per Mail |
| **Konfliktprüfung** | Doppelbuchung, Urlaub/Krankheit, fehlende oder **abgelaufene Qualifikation** (z. B. Arbeitsschutzunterweisung, Ersthelfer, Hubarbeitsbühne), Ruhezeit < 11 Std. (§ 5 ArbZG), > 10 Std. (§ 3 ArbZG), Pausen (§ 4 ArbZG) |
| **Personal & Qualifikationen** | Stammdaten, Beschäftigungsart, Soll-Stunden, Nachweise mit Upload und automatischem Ablaufdatum, Erinnerung vor Ablauf, Abwesenheiten |
| **Stundenauswertung** | Ist/Soll/Saldo, Nacht- (20–6), Kernnacht- (0–4), Sonntags- und Feiertagsstunden (§ 3b EStG, Feiertage je Bundesland), Minijob-Grenze, CSV für die Lohnbuchhaltung, **Schichten mit Zuschlägen direkt an Kunden abrechnen** |
| **Zeiterfassung** | Stoppuhr in der Kopfleiste, Nachtragen per Von/Bis/Pause oder Dauer, Wochenübersicht, Stundennachweis als PDF, CSV-Export |
| **Ausgaben** | Belegupload (PDF/Foto), Eingabe brutto oder netto, Kategorien, Lieferanten, Projektzuordnung, CSV-Export |
| **Dokumente** | Ordner, Zuordnung zu Kunde oder Projekt, Whitelist für Dateitypen, SHA-256-Prüfsumme |
| **Berichte** | Umsatz im Vorjahresvergleich, Top-Kunden und Top-Leistungen, EÜR (Zuflussprinzip, auch als PDF), USt-Übersicht mit ELSTER-Kennziffern (monatlich oder quartalsweise), offene Posten mit Altersstruktur, Ø Zahlungsdauer |
| **Steuerberater-Exporte** | DATEV-Buchungsstapel (EXTF, SKR03), Rechnungsausgangsbuch, Ausgabenliste |
| **Sicherheit** | bcrypt-Passwörter, 2FA (TOTP), Sperre nach Fehlversuchen, Rate-Limits, CSRF-Schutz, strikte Content Security Policy, serverseitige Sessions mit Sitzungsverwaltung, Passwort-Reset per Mail |
| **Verwaltung** | Benutzer und Rollen, Einstellungen (Firma, Bank, Nummernkreise, Texte, Mahnwesen, Design), API-Schlüssel, **hash-verkettetes Audit-Log mit Integritätsprüfung**, Backups, Systeminfo |
| **Globale Suche** | Über Kunden, Belege, Projekte, Anfragen, Aufgaben und Dateien, mit Live-Vorschau (Strg + K) |

---

## Schnellstart

Voraussetzung: **Node.js 22.5 oder neuer**. Eine separate Datenbank ist nicht nötig, SQLite ist in Node eingebaut.

```bash
cd backoffice
npm install
cp .env.example .env          # danach SESSION_SECRET, ADMIN_EMAIL usw. anpassen
npm run seed                  # optional: Demo-Daten (Hausmeister, Ausstellungsbau, Marketing, Digitalisierung)
npm start
```

Danach im Browser **http://localhost:3000** öffnen.

- **Mit Demo-Daten** (`npm run seed`): Login mit `ADMIN_EMAIL` aus der `.env` und dem Passwort `Demo-Passwort1`. Das Passwort überschreibst du mit `ADMIN_PASSWORD`. Weitere Demo-Konten: `mitarbeiter@example.com` und `buchhaltung@example.com`.
- **Ohne Demo-Daten**: Beim ersten Start wird ein Admin angelegt. Ist `ADMIN_PASSWORD` leer, steht ein Zufallspasswort einmalig im Konsolen-Log.

Erste Schritte nach dem Login:

1. **Einstellungen → Firma / Bank & Steuern**: Firmendaten, IBAN, Steuernummer oder USt-IdNr.
2. **Einstellungen → Design**: Logo hochladen, Markenfarbe wählen.
3. **Profil → 2FA aktivieren**.
4. **Artikel & Leistungen** anlegen, damit Angebote schnell gehen.
5. **API & Website**: Kontaktformular und Leistungskatalog auf joerg-noack.com einbauen.

---

### Leistungskatalog

Der Katalog mit den Leistungen von Jörg Noack ist hinterlegt (`src/lib/catalog.js`). Eingespielt wird er über **Artikel & Leistungen → „Leistungskatalog einspielen“** oder per `npm run catalog`. Bei Demo-Daten passiert das automatisch.

| Kategorie | Leistungen |
|---|---|
| Facility & Montage | Hausmeisterdienst (Std. / Monatspauschale), Einbau genormter Baufertigteile |
| Event & Ausstellung | Künstlerbetreuung (Std. / Tagespauschale), Ausstellungsbau |
| Digital & Marketing | Online-Marketing (Std. / Monatspauschale), Social-Media-Kommunikation (Std. / Monatspauschale), Kundenanfragen & digitale Vertriebsunterstützung |
| Organisation & Digitalisierung | Prozess- und Projektkoordination, Digitalisierung von Verwaltungs-, Dokumentations- und Planungsabläufen, KI-Unterstützung, Einsatz- und Qualitätsplanung, Erstellung und Pflege von Dokumentationen, Berichtswesen und Auswertungen |

Die Preise sind **Richtwerte** und lassen sich im Back Office ändern. Erneutes Einspielen ergänzt nur fehlende Leistungen und überschreibt keine eigenen Preise oder Texte.

## Produktivbetrieb (Server)

👉 **Schritt-für-Schritt-Anleitung für Einsteiger: [`docs/SERVER-INSTALLATION.md`](docs/SERVER-INSTALLATION.md)**

### Variante A: Ein-Befehl-Installer (empfohlen)

Auf einem frischen Server mit Ubuntu 22.04/24.04 oder Debian 12:

```bash
tar xzf backoffice-1.0.0.tar.gz && cd backoffice-1.0.0
sudo bash deploy/install.sh --domain office.joerg-noack.com --email info@joerg-noack.com
```

Der Installer erledigt:
- **Node.js 22** installieren, notfalls aus dem offiziellen Archiv mit SHA-256-Prüfung
- **Systemdienst** mit Autostart, eigenem Benutzer und Härtung: Schreibrecht nur aufs Datenverzeichnis, Port 3000 nur lokal erreichbar
- **Caddy** mit automatischem **HTTPS-Zertifikat** von Let's Encrypt
- **Firewall**: nur SSH, 80 und 443 offen
- **Automatische Sicherheitsupdates** des Betriebssystems
- **DNS-Prüfung**, Zufalls-Sitzungsschlüssel und Admin-Startpasswort

Du kannst ihn gefahrlos erneut ausführen; `.env` und Daten bleiben erhalten.

| Was | Wo |
|---|---|
| Programm | `/opt/backoffice` |
| Konfiguration | `/opt/backoffice/.env` |
| Daten, Uploads, Backups | `/var/lib/backoffice` |
| Startpasswort | `/root/backoffice-zugang.txt` (nach dem ersten Login löschen) |

**Paket erstellen** (auf deinem Rechner): `npm run package` erzeugt `dist/backoffice-<version>.tar.gz`.

**Update:** Neues Paket hochladen und entpacken, dann `sudo bash deploy/update.sh` ausführen. Das Skript macht vorher ein Backup, spielt die neue Version ein und prüft den Start. Startet die neue Version nicht, wird **automatisch die alte wiederhergestellt**.

### Variante B: Docker

```bash
cp .env.example .env    # NODE_ENV=production, SESSION_SECRET, BASE_URL, SMTP … setzen
docker compose up -d
```

Daten, Uploads und Backups liegen in `./data` (Volume), der Container läuft ohne Root-Rechte. Für HTTPS davor einen Reverse Proxy schalten, z. B. Caddy (`deploy/Caddyfile`) oder Nginx (`deploy/nginx.conf`), und in der `.env` `TRUST_PROXY=1` sowie `BASE_URL=https://…` setzen.

> ⚠️ Hinweis: **joerg-noack.com** war beim Erstellen nicht erreichbar (DNS ohne Antwort). Prüfe vor dem Livegang, ob Domain und DNS-Einträge stimmen.

### Produktions-Checkliste

- [ ] `NODE_ENV=production` und ein langer, zufälliger `SESSION_SECRET`. Ohne ihn verweigert der Server den Start.
- [ ] HTTPS aktiv, `BASE_URL` beginnt mit `https://`
- [ ] SMTP eingerichtet (Einstellungen → System → Testmail)
- [ ] 2FA für alle Admins
- [ ] Backups zusätzlich extern sichern (siehe unten)
- [ ] Firewall: nur 80/443 offen, Port 3000 nicht öffentlich

---

## Leistungen auf der Website anzeigen

Der Leistungskatalog aus dem Back Office lässt sich mit zwei Zeilen auf joerg-noack.com einbinden. Preise oder Texte änderst du nur noch im Back Office, nach spätestens 5 Minuten ist die Änderung auch auf der Website.

```html
<div id="noack-leistungen"></div>
<script src="https://office.joerg-noack.com/api/public/leistungen.js" defer></script>
```

- Darstellung: Karten nach Kategorie, Filter-Schaltflächen, „Anfrage stellen“-Button. Schrift und Textfarbe übernimmt das Widget von deiner Website, die Akzentfarbe ist einstellbar.
- Suchmaschinen: Das Widget ergänzt automatisch Strukturdaten (Schema.org `OfferCatalog`/`Service`).
- Steuerung: pro Leistung „Auf der Website anzeigen“, global unter **Verwaltung → API & Website**: Preise ein/aus („ab“-Preise, netto), Einleitungstext, Ziel des Anfrage-Buttons. Dort gibt es auch eine Vorschau.
- Optionen am `<div>`: `data-kategorie="Digital & Marketing"` (mehrere mit `|`), `data-filter="nein"`, `data-farbe="#0f766e"`, `data-kontakt="/kontakt"`, `data-intro="nein"`.
- Betreff übernehmen: Der Button öffnet die Kontaktseite mit `?betreff=Anfrage: …`. Bindet die Kontaktseite dasselbe Skript ein, steht der Betreff automatisch im Formular.
- Datenschutz: Veröffentlicht werden nur Name, Beschreibung, Einheit, Kategorie und (falls freigegeben) der Preis. Es werden keine Cookies gesetzt und keine personenbezogenen Daten übertragen. Rohdaten als JSON gibt es unter `GET /api/public/leistungen`.

## Website anbinden (Kontaktformular)

Anfragen von joerg-noack.com landen automatisch unter **Anfragen**. Zusätzlich gibt es eine Benachrichtigung im Back Office und eine E-Mail. Den fertigen HTML-Code zum Kopieren findest du im Back Office unter **Verwaltung → API & Website**.

```html
<form action="https://office.joerg-noack.com/api/public/kontakt" method="post">
  <input type="hidden" name="redirect" value="https://joerg-noack.com/kontakt">
  <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px"> <!-- Honeypot -->
  <input name="name" required placeholder="Name">
  <input type="email" name="email" required placeholder="E-Mail">
  <input type="tel" name="phone" placeholder="Telefon">
  <textarea name="message" required placeholder="Ihre Nachricht"></textarea>
  <label><input type="checkbox" name="consent" value="1" required> Ich stimme der Datenschutzerklärung zu.</label>
  <button>Senden</button>
</form>
```

- Nach dem Absenden wird der Besucher auf `redirect?gesendet=1` (bei Fehlern auf `?fehler=1`) zurückgeleitet. Das funktioniert nur für Adressen aus `CORS_ORIGINS`.
- Mit JSON (`fetch`) gibt die API `{ ok, message }` zurück. Ein Beispiel steht im Back Office.
- Spam-Schutz: Honeypot-Feld und höchstens 10 Anfragen pro Stunde und IP.
- Felder: `name`, `email`, `phone`, `company`, `subject`, `message`, `consent`. Deutsche Feldnamen (`telefon`, `firma`, `betreff`, `nachricht`, `datenschutz`) werden auch akzeptiert.
- **Datenschutzerklärung der Website ergänzen**: Zweck (Bearbeitung der Anfrage), Rechtsgrundlage (Art. 6 Abs. 1 lit. b DSGVO), Speicherdauer.

---

## Rollen & Rechte

| Bereich | Admin | Manager | Buchhaltung | Mitarbeiter |
|---|:-:|:-:|:-:|:-:|
| Dashboard, Kunden | ✔ | ✔ | ✔ | ✔ |
| Anfragen, Projekte, Aufgaben, Kalender, Zeiten | ✔ | ✔ | – | ✔ |
| Dienstplan ansehen (eigene Schichten auf dem Dashboard) | ✔ | ✔ | – | ✔ |
| Dienstplan bearbeiten, Personal, Stundenauswertung | ✔ | ✔ | – | – |
| Belege, Zahlungen, Artikel, Ausgaben, Berichte | ✔ | ✔ | ✔ | – |
| Rechnungen festschreiben / stornieren | ✔ | ✔ | ✔ | – |
| Zeiten aller Mitarbeiter | ✔ | ✔ | – | – |
| Verwaltung (Benutzer, Einstellungen, API, Backups, Audit) | ✔ | – | – | – |

Die Rechte sind in `src/lib/security.js` (`PERMISSIONS`) zentral definiert und dort leicht anpassbar.

---

## Rechtliches: GoBD, UStG, DSGVO

Die Software ist so gebaut, dass du die Anforderungen gut erfüllen kannst. Sie **ersetzt aber keine Steuer- oder Rechtsberatung**. Verfahrensdokumentation und Kontenrahmen stimmst du einmalig mit deinem Steuerberater ab.

- **Unveränderbarkeit (GoBD)**: Festgeschriebene Rechnungen und ihre Positionen sind per Datenbank-Trigger gegen Ändern und Löschen gesperrt. Korrekturen laufen ausschließlich über eine Stornorechnung.
- **Lückenlose Nummern**: Rechnungsnummern werden erst beim Festschreiben vergeben. Gelöschte Entwürfe erzeugen deshalb keine Lücken.
- **Nachvollziehbarkeit**: Das Audit-Log ist per Trigger unveränderlich und hash-verkettet. Unter Verwaltung → Protokoll → „Integrität prüfen“ wird jede Manipulation an der Datenbankdatei sichtbar.
- **§ 14 UStG Pflichtangaben**: Name und Anschrift beider Parteien, Steuernummer oder USt-IdNr., Datum, fortlaufende Nummer, Menge und Art, Leistungszeitpunkt, Entgelt nach Steuersätzen, Steuerbetrag. Ohne Leistungsdatum lässt sich eine Rechnung nicht festschreiben.
- **E-Rechnung**: Seit 01.01.2025 müssen Unternehmen in Deutschland E-Rechnungen empfangen können. Die Pflicht zum Ausstellen gilt im B2B ab 2027/2028 (Übergangsfristen). Der XRechnung-Export ist dafür vorbereitet. Vor dem ersten Produktiveinsatz eine Beispielrechnung mit dem [KoSIT-Validator](https://github.com/itplr-kosit/validator) prüfen.
- **Aufbewahrung**: Rechnungen und Belege 8 bzw. 10 Jahre (§ 147 AO, § 14b UStG). Deshalb **anonymisiert** die DSGVO-Funktion den Kunden, statt ihn zu löschen. Die eingefrorenen Daten auf festgeschriebenen Rechnungen bleiben erhalten.
- **Dienstplanung & Arbeitsrecht**: Die ArbZG-Prüfungen sind Warnungen. Tarifverträge können abweichende Regelungen enthalten. Die Zuschlagsfenster entsprechen § 3b EStG, die tatsächliche Zuschlagshöhe ergibt sich aus Arbeits- oder Tarifvertrag. Die Minijob-Grenze in den Einstellungen jedes Jahr prüfen.
- **DSGVO**: Auskunft nach Art. 15 als JSON-Export, Einwilligungsfeld, Anonymisierung, Hosting in Deutschland oder der EU empfohlen. Mit dem Hoster einen AV-Vertrag nach Art. 28 DSGVO abschließen.

---

## Backup & Wiederherstellung

- **Automatisch**: täglich per `VACUUM INTO`, konsistent auch im laufenden Betrieb. Es werden die letzten `BACKUP_KEEP` Sicherungen behalten (Standard: 30).
- **Manuell**: Verwaltung → Backups → „Backup jetzt erstellen“ oder `npm run backup`, z. B. per Cronjob.
- **Extern sichern (3-2-1-Regel)**: `data/backups/` **und** `data/uploads/` regelmäßig auf ein anderes System kopieren. Beispiel:

```bash
# /etc/cron.d/backoffice-offsite – täglich 3:15 Uhr auf einen zweiten Server
15 3 * * * root rsync -a /opt/backoffice/data/ backup@nas.local:/backups/backoffice/
```

**Wiederherstellen:**

```bash
systemctl stop backoffice            # bzw. docker compose down
cp data/backups/backup-2026-…sqlite data/backoffice.sqlite
rm -f data/backoffice.sqlite-wal data/backoffice.sqlite-shm
systemctl start backoffice
```

---

## REST-API

Den API-Schlüssel erzeugst du unter Verwaltung → API & Website. Mitgeschickt wird er als `Authorization: Bearer <Schlüssel>`. Limit: 120 Anfragen pro Minute.

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/public/kontakt` | Website-Anfrage (öffentlich, ohne Schlüssel) |
| GET | `/api/v1/kunden?limit=&offset=` | Kundenliste |
| GET | `/api/v1/kunden/:id` | Einzelner Kunde |
| POST | `/api/v1/kunden` | Kunde anlegen (Scope `write`) |
| GET | `/api/v1/rechnungen?status=&seit=` | Festgeschriebene Rechnungen |
| GET | `/api/v1/rechnungen/:id` | Rechnung mit Positionen |
| GET | `/api/v1/anfragen` | Anfragen |
| GET | `/api/v1/kennzahlen` | KPIs (Umsatz, offene Posten, neue Anfragen) |
| GET | `/api/public/leistungen` | Leistungskatalog für die Website (öffentlich) |
| GET | `/api/public/leistungen.js` | Einbau-Widget für den Leistungskatalog |
| GET | `/api/kalender/:user/:token.ics` | iCal-Feed (geheimer Token) |
| GET | `/healthz` | Health-Check fürs Monitoring |

```bash
curl -H "Authorization: Bearer bo_xxx" https://office.joerg-noack.com/api/v1/kennzahlen
```

Damit lassen sich z. B. **Make** oder **Zapier** anbinden, etwa für Slack-Nachrichten bei neuen Anfragen oder einen Sync mit Google Sheets.

---

## Technik & Architektur

- **Node.js 22 + Express**, serverseitig gerendert (EJS). Es gibt keinen Build-Schritt und kein Frontend-Framework, die Seiten laden schnell und lassen sich gut warten.
- **SQLite** (in Node eingebaut, WAL-Modus), Beträge als Integer in Cent, damit keine Rundungsfehler entstehen.
- Abhängigkeiten: express, ejs, helmet, bcryptjs, multer, pdfkit, qrcode, nodemailer. Keine externen CDNs, alles läuft lokal und ist CSP-konform.

```
backoffice/
├── src/
│   ├── server.js            Start, Hintergrundjobs (Abos, Backups, Aufräumen)
│   ├── app.js               Express-Setup, Sicherheit, Routing, Layout
│   ├── config.js            .env-Konfiguration
│   ├── db/                  Schema, Migrationen, Bootstrap, Demo-Daten
│   ├── lib/                 Fachlogik: sales (Belege), pdf, xrechnung, numbering,
│   │                        security, totp, audit, backup, mailer, csv, format, view
│   └── routes/              auth, dashboard, customers, leads, sales, products, projects,
│                            tasks, calendar, time, expenses, files, reports, admin, api
├── views/                   EJS-Templates
├── public/                  CSS, JavaScript, Favicon
├── tests/                   Automatisierte Tests (node:test)
├── deploy/                  Caddy, Nginx, systemd
├── Dockerfile, docker-compose.yml, .env.example
```

**Schema-Änderungen**: In `src/db/index.js` eine Funktion an `migrations` anhängen. Sie läuft beim nächsten Start genau einmal.

---

## Entwicklung & Tests

```bash
npm run dev      # Neustart bei Dateiänderungen
npm test         # 32 automatisierte Tests: Berechnung, GoBD-Sperren, Nummernkreise,
                 # Storno, Mahnwesen, Abos, XRechnung, TOTP, Audit-Kette, CSV,
                 # Login, CSRF, Rollen, Kontakt-API, API-Schlüssel, Feiertage,
                 # SFN-Stunden, ArbZG-Konflikte, Serien, Woche kopieren, Schichtabrechnung
```

Lizenz: siehe `LICENSE`.
