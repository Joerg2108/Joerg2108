# Demo-Version für Interessenten

Die Demo ist eine **eigene, öffentlich erreichbare Instanz** des Back Office mit der fiktiven **Muster Service GmbH**. Interessenten klicken sich selbst durch, statt nur Screenshots zu sehen. Mit deinem eigenen Back Office hat sie nichts zu tun: Es ist ein zweiter Dienst mit eigener Datenbank.

Technisch ist es derselbe Code. Der Schalter `DEMO_MODE=1` macht daraus die Demo, deshalb profitiert die Demo automatisch von jedem Update.

---

## Was die Demo kann

| Funktion | Details |
|---|---|
| **Neutrale Musterfirma** | Muster Service GmbH (Beratung, Service & Wartung, Montage, Digital, Schulung) mit 6 Kunden, 3 Projekten, Rechnungen, Mahnung, Angeboten, Abo, Anfragen, Ausgaben, Personal und Dienstplan |
| **Ein-Klick-Login** | Auf der Anmeldeseite drei Rollen: Geschäftsführung, Buchhaltung, Mitarbeiter. So sieht man sofort die Rechteverwaltung |
| **Demo-Banner** | Oben auf jeder Seite, mit Button **„Für Ihr Unternehmen anfragen“**, der zu deiner Kontaktseite führt |
| **Rundgang** | Kachel-Übersicht auf dem Dashboard mit den Highlights, passend zur jeweiligen Rolle |
| **Automatischer Reset** | Bei jedem Start und alle 6 Stunden werden alle Daten verworfen und die Musterdaten neu angelegt. Alle Daten liegen relativ zum heutigen Datum: Überfällige Rechnungen sind immer überfällig, der Dienstplan zeigt immer diese und nächste Woche |
| **Bewusste Konflikte** | Im Dienstplan stehen eine abgelaufene Hubarbeitsbühnen-Schulung, ein fehlender Ersthelfer-Nachweis und offene Schichten, ideal zum Vorführen der Konfliktprüfung |

### Was in der Demo gesperrt ist

| Gesperrt | Warum |
|---|---|
| Passwort ändern, 2FA, Profil | Sonst könnte ein Besucher die öffentlichen Zugänge für alle anderen kapern |
| Benutzer anlegen/ändern, API-Schlüssel | Kein Missbrauch der öffentlichen Instanz |
| Logo-Upload, Testmail, Backups | Kein Speicherplatz-Missbrauch |
| **E-Mail-Versand** | Grundsätzlich aus, auch wenn SMTP eingetragen ist. Rechnungen „versenden“ funktioniert, landet aber nur im Protokoll |
| Datei-Uploads | Nur PDF, PNG und JPG bis 2 MB; sie werden beim Reset gelöscht |
| Kontosperre nach Fehlversuchen | Abgeschaltet, sonst könnte jemand die Demo-Zugänge absichtlich sperren |

Alles andere geht, auch Einstellungen, Markenfarbe, Rechnungen festschreiben, Stornieren, DATEV-Export und PDFs. Beim nächsten Reset ist alles wieder sauber.

### Schutz deiner echten Daten

Der Demo-Modus löscht die Datenbank. Damit das **niemals** versehentlich bei echten Daten passiert, legt die Demo eine Markierungsdatei `.demo-instance` in ihr Datenverzeichnis. Findet sie beim Start eine Datenbank **ohne** diese Markierung, bricht sie mit einer Fehlermeldung ab und löscht nichts:

```
FEHLER: DEMO_MODE ist aktiv, aber /var/data/backoffice.sqlite enthält keine Demo-Daten.
Zum Schutz echter Daten wird nichts gelöscht. Demo-Instanzen brauchen ein eigenes, leeres DATA_DIR.
```

---

## Demo auf Render einrichten (kostenlos)

Die Datei **`render-demo.yaml`** im Hauptordner des Repositorys enthält alles. Die Demo läuft im **Free-Tarif**: Eine Disk braucht sie nicht, denn Datenverlust ist hier ja gewollt.

1. In **[dashboard.render.com](https://dashboard.render.com)** auf **„New +“ → „Blueprint“** klicken.
2. Das Repository **Joerg2108/Joerg2108** wählen.
3. Bei **„Blueprint Path“** `render-demo.yaml` eintragen (statt `render.yaml`).
4. Als Namen z. B. „Back Office Demo“ eingeben und **„Apply“** klicken.

Nach 2 bis 4 Minuten läuft die Demo unter einer Adresse wie `https://backoffice-demo-xxxx.onrender.com`.

> **Falls das Feld „Blueprint Path“ fehlt:** Lege den Dienst von Hand an: **New + → Web Service**, Repository wählen, dann
> Root Directory `backoffice`, Build Command `npm ci --omit=dev`, Start Command `node --no-warnings src/server.js`, Region Frankfurt, Instance Type **Free**, Health Check Path `/healthz`.
> Unter **Environment** diese Variablen eintragen:
>
> | Variable | Wert |
> |---|---|
> | `NODE_VERSION` | `22` |
> | `NODE_ENV` | `production` |
> | `TRUST_PROXY` | `1` |
> | `SESSION_SECRET` | beliebiger langer Zufallswert (Button „Generate“) |
> | `DEMO_MODE` | `1` |
> | `DEMO_RESET_HOURS` | `6` |
> | `DEMO_CONTACT_URL` | `https://joerg-noack.com/kontakt` |
> | `DEMO_VENDOR` | `Jörg Noack` |

### Free-Tarif: Was du wissen solltest

- Nach 15 Minuten ohne Besucher **schläft** der Dienst ein. Der nächste Aufruf dauert dann etwa **30 bis 60 Sekunden**. Der Neustart setzt die Demo automatisch frisch auf, das ist also eher ein Vorteil.
- **Vor einem Kundentermin** rufst du die Demo kurz vorher einmal auf, dann ist sie im Gespräch sofort da.
- Soll die Demo immer sofort antworten, stellst du in Render auf den Tarif **Starter** um. Eine Disk brauchst du auch dann nicht.

### Eigene Adresse (empfohlen)

`demo.joerg-noack.com` wirkt deutlich professioneller als `…onrender.com`:
Render → Dienst **backoffice-demo** → **Settings → Custom Domains** → `demo.joerg-noack.com` eintragen und den angezeigten **CNAME**-Eintrag bei deinem Domain-Anbieter anlegen (Ziel: `backoffice-demo-xxxx.onrender.com`).

### Anpassen

| Variable | Wirkung | Standard |
|---|---|---|
| `DEMO_RESET_HOURS` | Abstand zwischen zwei Resets in Stunden (mind. 1) | `6` |
| `DEMO_CONTACT_URL` | Ziel des Buttons „Für Ihr Unternehmen anfragen“; leer = kein Button | – |
| `DEMO_VENDOR` | Anbietername im Banner („Anbieter: …“); leer = ausgeblendet | – |

---

## Demo lokal oder auf einem eigenen Server

```bash
cd backoffice
DEMO_MODE=1 DATA_DIR=./demo-data npm start
```

Danach **http://localhost:3000** öffnen. Wichtig: Verwende immer ein **eigenes `DATA_DIR`**, nie das deines echten Back Office.

Für eine dauerhafte Demo auf deinem Server (z. B. neben dem echten Back Office) legst du einen zweiten Dienst mit eigenem Port und eigenem Datenverzeichnis an, etwa `PORT=3100`, `DATA_DIR=/var/lib/backoffice-demo`, `DEMO_MODE=1`, und leitest `demo.joerg-noack.com` in Caddy darauf weiter.

---

## Vorführleitfaden (15 Minuten)

Am besten teilst du im Gespräch den Bildschirm und klickst selbst. Danach schickst du den Link, damit der Interessent in Ruhe weiter ausprobiert.

| Minute | Was zeigen | Wo | Was sagen |
|---|---|---|---|
| 0–2 | Anmeldeseite, Rolle **Geschäftsführung** | `/login` | „Alles läuft im Browser, auch am Handy. Ihr Name und Ihr Logo stehen dann hier.“ |
| 2–4 | Dashboard: Umsatz, offene Posten, Überfälliges | `/` | „Morgens ein Blick und Sie wissen, wo Geld fehlt.“ |
| 4–6 | **Anfragen**: Website-Anfrage → Kunde übernehmen → Angebot | `/anfragen` | „Anfragen von Ihrer Website landen direkt hier, nichts geht im Postfach verloren.“ |
| 6–9 | **Rechnung**: neu, Leistungen aus dem Katalog, festschreiben, PDF mit GiroCode, **XRechnung** bei den Stadtwerken | `/belege/rechnungen` | „E-Rechnungspflicht im B2B: erledigt. Festgeschriebene Rechnungen sind GoBD-konform gesperrt.“ |
| 9–10 | **Mahnwesen** | `/belege/mahnwesen` | „Drei Mahnstufen mit Gebühren, ein Klick.“ |
| 10–12 | **Dienstplan**: rote Konflikte, offene Schichten, Stundenauswertung mit Zuschlägen | `/dienstplan` | „Arbeitszeitgesetz, Ruhezeiten und abgelaufene Schulungen prüft das System, bevor es teuer wird.“ |
| 12–13 | **Berichte**: EÜR, USt, DATEV-Export | `/berichte` | „Ihr Steuerberater bekommt die Daten fertig im DATEV-Format.“ |
| 13–14 | Abmelden → Rolle **Mitarbeiter** | `/login` | „Mitarbeiter sehen nur ihren Dienstplan, ihre Aufgaben und Zeiten.“ |
| 14–15 | **Einstellungen → Design**: Farbe ändern | `/admin/einstellungen` | „Das ist dann Ihr Back Office, mit Ihrem Namen. Ohne Abo, die Daten gehören Ihnen.“ |

**Abschluss:** Link zur Demo schicken, Paket aus `docs/VERKAUF.md` anbieten, Termin für die Einrichtung vorschlagen.

### Häufige Fragen von Interessenten

- **„Sind das echte Daten?“** Nein, alles ist fiktiv und wird alle 6 Stunden zurückgesetzt.
- **„Kann ich meine eigenen Daten testen?“** In der Demo bitte nicht, sie ist öffentlich. Für einen Test mit echten Daten richtest du eine eigene Testinstallation ein (Render Starter oder Server).
- **„Warum kann ich das Passwort nicht ändern?“** Weil die Demo-Zugänge für alle Besucher gleich sind. In der eigenen Installation geht das natürlich, inklusive 2FA.
- **„Kommen E-Mails an?“** In der Demo nicht. In der eigenen Installation gehen Rechnungen, Mahnungen und Passwort-Links über Ihr eigenes Postfach raus.
