# Back Office auf Render – Schritt für Schritt

Render betreibt das Back Office für dich: Server, HTTPS-Zertifikat, Neustarts und Updates laufen automatisch. Du musst nichts auf einem Linux-Server installieren. Die komplette Konfiguration steht in der Datei **`render.yaml`** im Hauptordner des Repositorys (ein sogenannter „Blueprint“).

Zeitaufwand: etwa **15 Minuten**, mit eigener Domain etwas mehr.

> Du suchst die **öffentliche Demo für Interessenten**? Die läuft als eigener, kostenloser Dienst über `render-demo.yaml`: siehe **[DEMO.md](DEMO.md)**.

---

## Wichtig vorab: Kosten & Tarif

Das Back Office speichert alle Daten (Kunden, Rechnungen, Belege) in einer Datenbankdatei. Dafür braucht es eine **dauerhafte Festplatte (Persistent Disk)**.

| Tarif | Geeignet? | Warum |
|---|---|---|
| **Free** | ❌ **Nein** | keine Disk; **alle Daten wären nach jedem Neustart weg**, außerdem schläft der Dienst nach Inaktivität ein |
| **Starter** (bezahlt) | ✅ Ja | Disk möglich, läuft dauerhaft; in `render.yaml` fest eingestellt |

Die aktuellen Preise stehen auf [render.com/pricing](https://render.com/pricing): Starter-Instanz plus 1 GB Disk, insgesamt im einstelligen bis niedrigen zweistelligen Dollarbereich pro Monat.

---

## Schritt 1: Code bereitstellen

Render baut das Back Office direkt aus deinem GitHub-Repository **Joerg2108/Joerg2108**.

- Der Code liegt im Pull Request [Joerg2108/Joerg2108#5](https://github.com/Joerg2108/Joerg2108/pull/5). **Merge ihn** in den Standard-Branch. Alternativ wählst du in Schritt 2 den Branch `claude/determined-hopper-45dyew` aus.
- Die Datei `render.yaml` liegt im Hauptordner, das Programm im Unterordner `backoffice/`. Das ist in `render.yaml` bereits so eingetragen (`rootDir: backoffice`).

---

## Schritt 2: Blueprint anlegen

1. Auf **[dashboard.render.com](https://dashboard.render.com)** registrieren bzw. anmelden. Am einfachsten geht das direkt **mit GitHub**.
2. Oben rechts **„New +“ → „Blueprint“** wählen.
3. **GitHub verbinden** und Render den Zugriff auf das Repository **Joerg2108/Joerg2108** erlauben.
4. Das Repository auswählen, den **Branch** prüfen und als Namen z. B. „Back Office“ eingeben.
5. Render liest `render.yaml` und zeigt an, was angelegt wird:
   - Web Service **backoffice** (Region Frankfurt, Tarif Starter)
   - Disk **backoffice-data** (1 GB, unter `/var/data`)
6. Render fragt zwei Werte ab:

   | Variable | Was eintragen |
   |---|---|
   | `ADMIN_EMAIL` | deine Login-E-Mail, z. B. `info@joerg-noack.com` |
   | `ADMIN_PASSWORD` | ein Startpasswort mit mindestens 10 Zeichen, Groß- und Kleinbuchstaben und einer Ziffer |

7. Auf **„Apply“** klicken. Render baut und startet jetzt das Back Office (2–4 Minuten). Den Fortschritt siehst du unter **Logs**.

Danach ist das Back Office unter einer Adresse wie **`https://backoffice-xxxx.onrender.com`** erreichbar. Sie steht oben im Dashboard des Dienstes.

> Alles andere stellt `render.yaml` automatisch ein: einen zufälligen Sitzungsschlüssel (`SESSION_SECRET`), das Datenverzeichnis auf der Disk, Node.js 22, den Produktionsmodus, den Health-Check und die Freigabe für joerg-noack.com (`CORS_ORIGINS`).

---

## Schritt 3: Einloggen & einrichten

1. `https://backoffice-xxxx.onrender.com` öffnen und mit `ADMIN_EMAIL` und `ADMIN_PASSWORD` anmelden.
2. **Profil → Passwort ändern** und **2FA aktivieren**.
3. Danach in Render unter **Environment** die Variable `ADMIN_PASSWORD` **löschen**. Sie wird nur beim allerersten Start gebraucht.
4. **Einstellungen → Firma / Bank & Steuern / Design** ausfüllen.
5. **Artikel & Leistungen → „Leistungskatalog einspielen“**.

---

## Schritt 4: Eigene Adresse office.joerg-noack.com (empfohlen)

1. In Render beim Dienst **Settings → Custom Domains → „Add Custom Domain“** wählen und `office.joerg-noack.com` eintragen.
2. Render zeigt an, welchen DNS-Eintrag du brauchst, in der Regel:

   | Typ | Name / Host | Ziel |
   |---|---|---|
   | **CNAME** | `office` | `backoffice-xxxx.onrender.com` |

   Diesen Eintrag legst du dort an, wo **joerg-noack.com** registriert ist.
3. Sobald Render die Domain bestätigt („Verified“), wird das HTTPS-Zertifikat automatisch ausgestellt.
4. Unter **Environment** die Variable `BASE_URL` = `https://office.joerg-noack.com` hinzufügen und speichern. Render startet den Dienst dann neu. Damit verwenden Links in E-Mails, der iCal-Feed und die Website-Code-Schnipsel die neue Adresse.

> ⚠️ Beim Erstellen der Software war **joerg-noack.com** per DNS nicht erreichbar. Prüfe in der DNS-Verwaltung, ob auch die Einträge deiner Website stimmen.

---

## Schritt 5: E-Mail-Versand (SMTP)

Damit Rechnungen per Mail gehen und „Passwort vergessen“ funktioniert, fügst du unter **Environment** diese Variablen mit den Daten deines Mail-Postfachs hinzu:

| Variable | Beispiel (IONOS) |
|---|---|
| `SMTP_HOST` | `smtp.ionos.de` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `info@joerg-noack.com` |
| `SMTP_PASS` | Passwort des Postfachs |
| `SMTP_FROM` | `Jörg Noack <info@joerg-noack.com>` |

Speichern → Render startet neu. Testen kannst du unter **Einstellungen → System → Testmail senden**.

---

## Schritt 6: Website anbinden

Im Back Office unter **Verwaltung → API & Website** stehen die fertigen Code-Schnipsel für das **Kontaktformular** und den **Leistungskatalog**, schon mit deiner Render- bzw. eigenen Adresse. Diese baust du auf joerg-noack.com ein.

Steht deine Website zusätzlich unter einer anderen Adresse, ergänzt du sie in Render bei `CORS_ORIGINS` (kommagetrennt).

---

## Updates

Updates laufen automatisch (`autoDeploy`): Sobald neuer Code in den gewählten Branch kommt, baut Render die neue Version und startet sie. Die Daten auf der Disk bleiben erhalten.

> Weil eine Disk angebunden ist, gibt es beim Deploy eine **kurze Unterbrechung** von etwa 1 Minute. Größere Updates spielst du daher am besten abends ein.

---

## Datensicherung

| Was | Wo |
|---|---|
| Tägliches Backup der Datenbank (automatisch, 30 Stände) | auf der Disk unter `/var/data/backups` |
| Backups herunterladen | Back Office → **Verwaltung → Backups** |
| Snapshots der Disk | Render-Dashboard → Dienst → **Disks** |

**Empfehlung:** Lade regelmäßig ein Backup herunter, z. B. monatlich und vor größeren Änderungen, und speichere es außerhalb von Render (PC, NAS, Cloud). Hochgeladene Belege liegen unter `/var/data/uploads`. Sicherer Download: Render-Shell (siehe unten) oder die Dokumentenverwaltung im Back Office.

---

## Notfälle

**Passwort vergessen und kein E-Mail-Versand eingerichtet:**
Im Render-Dashboard beim Dienst den Tab **„Shell“** öffnen und eingeben:
```bash
node --no-warnings src/lib/reset-password-cli.js info@joerg-noack.com
```
Es wird ein neues Passwort angezeigt; 2FA und Sperren werden dabei zurückgesetzt.

**Dienst startet nicht:** Unter **Logs** die letzten Meldungen ansehen. Häufigste Ursache ist ein Tippfehler in einer Umgebungsvariable. Über **Manual Deploy → Rollback** kommst du zur letzten funktionierenden Version zurück.

**Backup zurückspielen:** In der **Shell**:
```bash
ls /var/data/backups
cp /var/data/backups/backup-<datum>.sqlite /var/data/restore.sqlite
```
Danach unter **Environment** `DB_FILE=restore.sqlite` setzen und speichern; der Dienst startet mit dem Backup neu.

---

## Datenschutz (DSGVO)

- **Region Frankfurt**: Die Daten liegen in einem Rechenzentrum in der EU.
- Render ist ein US-Anbieter. Schließe im Render-Konto den **Auftragsverarbeitungsvertrag (DPA)** ab und erwähne Render in deiner Datenschutzerklärung.
- Wer Daten ausschließlich bei einem deutschen Anbieter halten möchte, nutzt stattdessen einen eigenen Server (`docs/SERVER-INSTALLATION.md`).
