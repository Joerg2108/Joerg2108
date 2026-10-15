# BauDaH Office

Bürosoftware für **BauDaH Bauunternehmen – Meisterbetrieb** (Daniel Hönemann, Naunhof).
Angebote, Rechnungen, Kunden und Leistungskatalog in einem System – läuft lokal im Büro, die Daten bleiben im Haus.

---

## Funktionen

### Angebote
- Aufbau wie ein Bau-Leistungsverzeichnis: **Titel** (Gewerke) mit Titelsummen, **Positionen** mit Kurz- und Langtext, **Textzeilen**, **Seitenumbrüche**
- **Eventualpositionen** (nur Einzelpreis, nicht in der Summe)
- Positionen per **Drag & Drop** sortieren, Autovervollständigung aus dem Leistungskatalog, Mehrfachauswahl aus dem Katalog mit Mengen
- Pro Position: Nachlass %, Lohnanteil %, MwSt-Satz, Einkaufspreis → **Live-Rohertrag und Marge**
- Gesamtrabatt, Gültigkeitsdatum, Status (Entwurf → Versendet → Angenommen/Abgelehnt → Abgerechnet)
- PDF mit **Auftragserteilung zum Unterschreiben** am Ende

### Rechnungen – direkt aus dem Angebot
- **Rechnung**, **Abschlagsrechnung** (Prozent oder Betrag), **Schlussrechnung** mit automatischem Abzug aller Abschläge
- **GoBD-konform:** fortlaufender, lückenloser Nummernkreis; beim Festschreiben wird die Rechnung unveränderbar. Korrektur nur per **Stornorechnung**
- Pflichtangaben-Prüfung nach § 14 UStG (Steuernummer, Leistungszeitraum …) vor dem Festschreiben
- **§ 13b UStG (Reverse Charge)** für Bauleistungen an Bauunternehmer – automatisch je Kunde
- **§ 35a EStG**: Lohnkostenausweis für Privatkunden (Steuerbonus Handwerkerleistungen) – automatisch berechnet
- Skonto, Zahlungsziel, Zahlungseingänge (Teilzahlungen), Status offen/teilbezahlt/bezahlt/überfällig
- **Mahnwesen**: Zahlungserinnerung, 1. und 2. Mahnung mit Gebühren, eigenem PDF und Mail
- **E-Rechnung (XRechnung 3.0, CII)** – geprüft mit dem offiziellen KoSIT-Validator. Pflicht beim Empfang seit 2025, beim Versand ab 2027/2028

### E-Mail-Versand
- Versand direkt aus dem Programm (SMTP, z. B. GMX) mit PDF und optional XRechnung im Anhang
- Vorlagen mit Platzhaltern (`{anrede}`, `{nummer}`, `{betrag}`, `{faellig}` …), korrekte Briefanrede automatisch
- BCC an sich selbst, vollständiges Versandprotokoll; SMTP-Passwort wird verschlüsselt gespeichert (AES-256-GCM)

### Kunden & Leistungskatalog
- Privat-, Gewerbe- und öffentliche Kunden, Ansprechpartner, Konditionen (Zahlungsziel, Rabatt), USt-IdNr., Leitweg-ID
- Kundenakte mit Umsatz, offenen Posten, Auftragsquote und allen Belegen
- Leistungskatalog mit **47 vorbefüllten Leistungen** passend zu den Gewerken auf der Visitenkarte (Maurer, Putz, Fugen, Fassade/Klinker, Trockenbau, Pflaster/Wege, Landschaftsbau, Reparatur) – Preise sind Richtwerte und sollten angepasst werden
- **Preisanpassung** um x % (alle oder je Gewerk) mit automatischer Sicherung
- CSV-Import/-Export (Excel-kompatibel) für Kunden und Leistungen

### DATEV-Export für den Steuerberater
- **DATEV-Buchungsstapel** (Format EXTF 700) mit allen festgeschriebenen Rechnungen und optional den Zahlungseingängen
- Je Steuersatz eine Buchungszeile, § 13b-Erlöse auf eigenem Konto, Storno als Gegenbuchung
- Schlussrechnungen nur mit dem Restbetrag nach Abzug der Abschläge, damit nichts doppelt gebucht wird
- Kontenrahmen SKR 03 / SKR 04 mit Standardkonten, Kundennummer = Debitorenkonto (oder Sammeldebitor)
- Zeitraum frei wählbar (Schnellwahl letzter Monat / Quartal / Jahr) mit Vorschau vor dem Download
- Einrichtung: *Einstellungen → DATEV-Export* → Berater- und Mandantennummer vom Steuerberater eintragen

### Übersicht & Sicherheit
- Dashboard: Umsatz, offene/überfällige Forderungen, Angebotsquote, Monatsdiagramm, Top-Kunden, Aufgabenlisten
- Globale Suche (**Strg + K**), **Strg + S** speichert im Editor
- Benutzerverwaltung (Administrator/Benutzer), Passwörter mit scrypt gehasht, Schutz gegen Brute-Force
- **Tägliche automatische Datensicherung** (30 Tage), Sicherung jederzeit herunterladbar
- Änderungsprotokoll

---

## Installation (Windows)

1. **Node.js** installieren: <https://nodejs.org> → Version **22 LTS oder neuer** (wichtig: mind. 22.5).
2. Den Ordner `baudah-office` z. B. nach `C:\BauDaH-Office` kopieren.
3. **`start.bat` doppelklicken.** Beim ersten Start werden die Pakete installiert, danach öffnet sich der Browser mit <http://localhost:3000>.
4. Ersteinrichtung: Administrator-Passwort festlegen.
5. Unter **Einstellungen** ergänzen:
   - *Bank & Steuer*: Steuernummer, IBAN – **ohne Steuernummer können keine Rechnungen festgeschrieben werden**
   - *Firma & Logo*: Logo hochladen (optional – sonst wird die BauDaH-Wortmarke verwendet)
   - *E-Mail-Versand*: GMX-Zugang (s. u.), dann „Testmail senden“

Tipp: Eine Verknüpfung von `start.bat` in den Autostart-Ordner (`Win + R` → `shell:startup`) legen – dann läuft das Programm nach dem Hochfahren automatisch.

**Zugriff von anderen PCs/Tablets im Büro-Netz:** `http://<IP-des-Büro-PCs>:3000` (Windows-Firewall für Port 3000 freigeben). Nicht ungeschützt ins Internet stellen – für Fernzugriff ein VPN (z. B. FRITZ!Box-VPN) nutzen.

### GMX einrichten
| Feld | Wert |
|---|---|
| SMTP-Server | `mail.gmx.net` |
| Port | `587` (STARTTLS, Haken „SSL/TLS“ **aus**) |
| Benutzername | `baudah@gmx.net` |
| Passwort | GMX-Passwort |

Im GMX-Webmail unter *E-Mail → Einstellungen → POP3/IMAP Abruf* „**Zugriff über POP3/IMAP/SMTP erlauben**“ aktivieren, sonst lehnt GMX den Versand ab.

---

## Demo-Modus (zum Testen und Vorführen)

Im leeren System erscheint auf der Übersicht der Button **„Demo-Daten laden“** (auch unter *Einstellungen → Datensicherung*). Er legt an:
- 8 Beispielkunden: privat, gewerblich mit § 13b, Stadt Naunhof als öffentlicher Auftraggeber mit Leitweg-ID
- 10 Angebote in allen Status (Entwurf, versendet, angenommen, abgelehnt, abgerechnet)
- 8 Rechnungen der letzten 5 Monate: bezahlt, teilbezahlt, offen, **überfällig mit Zahlungserinnerung**, Abschlag + Schlussrechnung
- Zahlungseingänge, sodass Übersicht, Diagramm und Top-Kunden sofort gefüllt sind

**Vor dem Echtbetrieb:** *Einstellungen → Datensicherung → „Alles zurücksetzen“* (Bestätigung durch Eintippen von `LÖSCHEN`). Das löscht alle Kunden und Belege und setzt die Nummernkreise zurück, die erste echte Rechnung ist dann wieder RE-…-0001. Einstellungen, Leistungskatalog und Benutzer bleiben erhalten, vorher wird automatisch gesichert.

## Typischer Ablauf

1. **Kunde** anlegen (oder direkt im Angebot über „Neuen Kunden anlegen“)
2. **Neues Angebot** → Kunde wählen → Bauvorhaben → „Aus Leistungskatalog“ → Mengen eintragen → Speichern
3. **Per E-Mail** senden – Status wird automatisch „Versendet“
4. Auftrag erteilt → **Abschlag** (z. B. 30 %) oder direkt **In Rechnung umwandeln**
5. Leistungszeitraum eintragen → **Festschreiben & senden**
6. Zahlung eingegangen → **Zahlung erfassen** · überfällig → **Zahlungserinnerung erstellen**
7. Zum Schluss: **Schlussrechnung** – die Abschläge werden automatisch abgezogen

---

## Datensicherung & Wiederherstellung

- Alle Daten liegen im Ordner `data/` (`baudah.sqlite`, Logo, `secret.key`).
- Automatische Sicherungen: `data/backups/` (täglich, 30 Stück).
- **Wichtig:** Den kompletten Ordner `data/` regelmäßig zusätzlich extern sichern (USB-Stick, NAS). Rechnungen sind **8 Jahre** aufzubewahren (§ 147 AO).
- Wiederherstellen: Programm beenden → Sicherungsdatei nach `data/baudah.sqlite` kopieren → starten.
- `data/secret.key` mitsichern – ohne ihn muss nur das SMTP-Passwort neu eingegeben werden.

---

## Technik

| | |
|---|---|
| Server | Node.js ≥ 22.5, Express 5 |
| Datenbank | SQLite (in Node eingebaut, keine Installation nötig) |
| PDF | PDFKit – DIN-5008-Briefbogen mit Falz-/Lochmarken, Übertrag bei Seitenwechsel |
| E-Mail | Nodemailer (SMTP) |
| E-Rechnung | XRechnung 3.0 (UN/CEFACT CII), validiert mit KoSIT-Validator 1.5 / Konfiguration 3.0.2 |
| Oberfläche | Browser-App ohne Build-Schritt (Vanilla JS, ES-Module) |

Konfiguration über Umgebungsvariablen: `PORT` (Standard 3000), `HOST` (Standard 0.0.0.0), `BAUDAH_DATA` (Datenordner).

```
baudah-office/
├── server.js            Einstiegspunkt
├── src/
│   ├── db.js            Schema, Einstellungen, Nummernkreise, Start-Katalog
│   ├── documents.js     Beleg-Logik (Ableiten, Festschreiben, Storno, Zahlungen, Mahnungen)
│   ├── pdf.js           PDF-Briefbogen
│   ├── xrechnung.js     E-Rechnung
│   ├── mail.js          E-Mail-Versand
│   ├── datev.js         DATEV-Buchungsstapel
│   ├── demo.js          Demo-Daten & Neustart
│   ├── auth.js          Login, Sessions, Verschlüsselung
│   ├── backup.js        Datensicherung
│   └── api.js           REST-API
└── public/              Oberfläche (calc.js wird von Browser UND Server genutzt)
```

## Hinweis

Die Software unterstützt bei der Erstellung rechtskonformer Belege, ersetzt aber keine Steuerberatung. Textbausteine (§ 13b, § 35a, Mahnungen) und Preise vor dem Produktiveinsatz mit dem Steuerberater abstimmen.
