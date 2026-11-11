# Verkaufsdemo – von der Anfrage bis zur bezahlten Rechnung

Stand: November 2026. Gilt für beide Demo-Versionen (Dienstleistung und Sicherheit) und für das Back Office selbst.
Alle Zahlen in diesem Dokument sind im Browser nachgemessen (siehe „Was geprüft ist“).

## Der Kernablauf

Das Back Office dreht sich um einen Vorgang: **Aus einer Anfrage wird Geld.**
Anfrage → Angebot → (Auftrag) → Rechnung → Zahlung, bei Verzug Mahnung.

Jede Ansicht beantwortet jetzt drei Fragen:

| Frage | Wo es steht |
|---|---|
| Wo bin ich? | Zurück-Link über der Überschrift, Überschrift mit Nummer und Status, Vorgangsleiste |
| Was braucht meine Aufmerksamkeit? | Übersicht: „Heute zu tun“. Im Vorgang: der Kasten „Nächster Schritt“ |
| Was kann ich als Nächstes tun? | Genau eine blaue Hauptaktion je Ansicht |

## Die drei wichtigsten Änderungen

### 1. Übersicht: Arbeitsliste statt Zahlenwand

| | Vorher | Nachher |
|---|---|---|
| Was der Nutzer will | Wissen, was heute zu erledigen ist | |
| Was ihn aufhielt | 7 Kennzahlen, ein Diagramm und ein Rundgang mit 9 Kacheln standen über allem. Überfällige Rechnungen und neue Anfragen kamen erst nach dem Scrollen | |
| Lösung | | „Heute zu tun“: jede Zeile ist ein Vorgang mit Betrag und einer Aktion (Mahnen, Beantworten, Rechnung erstellen, Fertigstellen, Nachfassen, Senden). 4 Kennzahlen, jede führt in die passende gefilterte Liste. Der Demo-Rundgang ist eingeklappt |

Bilder: `verkaufsdemo/vorher-01-dashboard.png`, `verkaufsdemo/nachher-01-dashboard.png`

### 2. Anfrage: in einem Schritt zum Angebot

| | Vorher | Nachher |
|---|---|---|
| Was der Nutzer will | Auf eine Anfrage ein Angebot schreiben | |
| Was ihn aufhielt | „Als Kunde übernehmen“ führte in die Kundenakte. Dort „+ Angebot“ klicken, Betreff neu eintippen. Die Anfrage wusste danach nichts vom Angebot | |
| Lösung | | „Angebot erstellen“ legt den Kunden an (oder verknüpft den bestehenden mit derselben E-Mail-Adresse), öffnet das Angebot und übernimmt den Betreff. Die Anfrage zeigt danach Angebot und Rechnung |
| Gemessen | 3 Bedienschritte bis zum ausgefüllten Angebotskopf | 1 Bedienschritt |

Bilder: `verkaufsdemo/vorher-03-anfrage.png`, `verkaufsdemo/nachher-03-anfrage.png`

### 3. Beleg: der nächste Schritt steht da

| | Vorher | Nachher |
|---|---|---|
| Was der Nutzer will | Den Vorgang weiterbringen | |
| Was ihn aufhielt | Fünf gleich wichtige Schaltflächen. „Rechnung erstellen“ lag im Menü „Aktionen ▾“. Ein Statuswechsel wurde nicht bestätigt | |
| Lösung | | Vorgangsleiste Angebot → Auftrag → Rechnung → Zahlung. Darunter „Nächster Schritt“ mit Erklärung und einer Hauptaktion je Zustand. Jede Änderung wird oben bestätigt |

Bilder: `verkaufsdemo/vorher-05-angebot.png`, `verkaufsdemo/nachher-05-angebot.png`, `verkaufsdemo/nachher-rechnung-bezahlt.png`

### Gesamter Ablauf, nachgemessen

Derselbe Vorgang (Anfrage „Andrea Hoffmann“ bis zur bezahlten Rechnung) in beiden Versionen:

| Schritt | Vorher (12) | Nachher (10) |
|---|---|---|
| 1 | Dashboard: Anfrage öffnen | Übersicht: Anfrage öffnen |
| 2 | „Als Kunde übernehmen“ (landet in der Kundenakte) | „Angebot erstellen“ |
| 3 | Kundenakte: „+ Angebot“ | Leistung aus dem Katalog wählen |
| 4 | Betreff von Hand eintippen | „Speichern“ |
| 5 | Leistung aus dem Katalog wählen | „Angebot per E-Mail senden“ |
| 6 | „Speichern“ | „Angenommen – Rechnung erstellen“ |
| 7 | im Seitenbereich „Senden“ | „Speichern & festschreiben“ |
| 8 | Menü „Aktionen ▾“ öffnen | „Rechnung per E-Mail senden“ |
| 9 | „→ Rechnung erstellen“ | „Zahlung erfassen“ (springt ins Betragsfeld, Betrag vorbelegt) |
| 10 | „Speichern & festschreiben“ | Zahlung bestätigen |
| 11 | im Seitenbereich „Senden“ | |
| 12 | „Zahlung erfassen“ | |

Wichtiger als die zwei gesparten Schritte: Nachher steht jede Aktion als Hauptaktion im Kasten „Nächster Schritt“. Vorher musste der Nutzer dreimal wissen, wo die Funktion liegt (Kundenakte, Menü „Aktionen“, Seitenbereich).

## Weitere Verbesserungen im Alltag

| Thema | Vorher | Nachher |
|---|---|---|
| Speicherfehler im Formular | Sprung auf die Startseite, alle Eingaben weg | Zurück im Formular, Eingaben samt Positionen wieder da |
| Zurück aus dem Beleg | Liste ohne Filter, Anfang der Seite | Gleicher Filter, gleiche Position |
| Suche ohne Treffer | „Keine Belege gefunden.“ | Grund genannt, dazu „In allen Rechnungen suchen“ und „Alle Rechnungen anzeigen“ |
| Listen am Smartphone | Tabelle zum seitlichen Scrollen, Datumsfelder verzerrt | Karten, kein seitliches Scrollen |
| Status | nur Farbe | Farbe, Punkt und Wort |
| Tastatur | kein sichtbarer Fokus | Sprunglink „Zum Inhalt“, sichtbarer Fokusring, Strg + K für die Suche |
| Verlauf im Beleg | technische Namen wie `beleg.festgeschrieben` | „Festgeschrieben“, „Zahlung erfasst“ |
| Gestaltung | Farbverläufe und Glaseffekt | Ruhige Fläche, eine Akzentfarbe aus den Einstellungen des Kunden, Zustandsfarben nur für Status |

## Käuferdemo in drei Minuten

Vorbereitung: Demo frisch öffnen (nach einem Reset), als „Geschäftsführung“ anmelden. Fenster so breit, dass die Seitenleiste sichtbar ist.

**0:00 – Das Problem (20 Sekunden, noch nichts klicken)**
„Montagmorgen. Am Wochenende kam über die Website eine Anfrage vom Hotel Am Park, Wartungsvertrag für 40 Zimmer. Bei den meisten Betrieben liegt die jetzt im Postfach, das Angebot entsteht in Word, die Rechnung in einem dritten Programm. Und ob bezahlt wurde, weiß nur das Bankkonto. Ich zeige Ihnen denselben Vorgang hier, von der Anfrage bis zum Geldeingang.“

**0:20 – Übersicht (20 Sekunden)**
Auf „Heute zu tun“ zeigen. „Das ist keine Statistik, das ist die Arbeit von heute: zwei überfällige Rechnungen, zwei neue Anfragen, ein angenommenes Angebot ohne Rechnung.“
Klick auf **Neue Anfrage · Andrea Hoffmann · Hotel Am Park**.

**0:40 – Anfrage (20 Sekunden)**
„Oben sehe ich, wo der Vorgang steht. Darunter, was als Nächstes dran ist.“
Klick auf **Angebot erstellen**.

**1:00 – Angebot (40 Sekunden)**
„Der Kunde ist angelegt, der Betreff steht drin. Ich musste nichts abtippen.“
Im Feld **Leistung aus Katalog einfügen** eine Leistung wählen, Summe zeigen. Klick auf **Speichern**.
Klick auf **Angebot per E-Mail senden**. (In der Demo wird der Versand simuliert, der Hinweis oben sagt das.)

**1:40 – Rechnung (40 Sekunden)**
„Das Hotel sagt zu.“ Klick auf **Angenommen – Rechnung erstellen**, dann **Speichern & festschreiben**.
„Jetzt hat die Rechnung ihre Nummer und kann nicht mehr verändert werden. Das verlangt das Finanzamt.“
Kurz **PDF ansehen** öffnen und wieder schließen. Unter „Weitere Aktionen“ auf **XRechnung herunterladen** zeigen.

**2:20 – Zahlung (25 Sekunden)**
Klick auf **Zahlung erfassen**, der Betrag steht schon drin, bestätigen.
„Vier Haken, Vorgang abgeschlossen.“ Auf die Vorgangsleiste zeigen.

**2:45 – Ergebnis (15 Sekunden)**
Zurück zur **Übersicht**: Die Anfrage ist aus „Heute zu tun“ verschwunden.
Klick auf **Rechnung überfällig · Praxis Dr. Sommer**, auf „Mahnung erstellen (Stufe 2)“ zeigen.
„Und wenn jemand nicht zahlt, steht auch das hier.“

## Drei Verkaufsargumente, die die Demo belegt

1. **Eine Anfrage wird in zehn Bedienschritten zur bezahlten Rechnung, ohne ein zweites Programm.**
   Beleg: der Ablauf oben, Minute 0:20 bis 2:45.
2. **Die Software sagt, was als Nächstes zu tun ist.**
   Beleg: „Heute zu tun“ auf der Übersicht und der Kasten „Nächster Schritt“ in jeder Anfrage und jedem Beleg.
3. **Nichts geht verloren und nichts wird doppelt getippt.**
   Beleg: Betreff und Kunde wandern von der Anfrage ins Angebot, die Positionen vom Angebot in die Rechnung. Die Anfrage zeigt am Ende Angebot und Rechnung, der Verlauf im Beleg jeden Schritt mit Zeit und Name.

Nicht in der Demo behaupten: Zeitersparnis in Minuten oder Prozent. Gemessen sind Bedienschritte, keine Arbeitszeiten echter Nutzer.

## Was geprüft ist

Automatische Tests (`npm test`): 55 von 55 bestanden, davon 5 neu für diese Überarbeitung.

Im Browser durchgespielt (Skript `verkaufsdemo/pruefung-ablauf.js`, Playwright, gegen die lokale Demo):

| Ablauf | Ergebnis |
|---|---|
| Anfrage → Angebot → Rechnung → Zahlung, inkl. PDF und XRechnung der neuen Rechnung | bestanden, 10 Bedienschritte |
| Derselbe Ablauf in der Version vor der Überarbeitung | 12 Bedienschritte |
| Zurück aus dem Beleg: Filter und Scrollposition bleiben | bestanden |
| Suche ohne Treffer: Weg zurück zu Ergebnissen | bestanden |
| Speicherfehler: Eingaben und Positionen bleiben | bestanden (vorher: Startseite, Eingaben weg) |
| Tastatur: Sprunglink, Strg + K, Fokusring, Zeile mit Enter öffnen | bestanden |
| Tablet (820 px) und Smartphone (390 px): 6 Ansichten ohne seitliches Scrollen | bestanden |
| Rollen: Buchhaltung ohne Anfragen, Mitarbeiter ohne Belege | bestanden |
| Kontraste (12 Farbpaare, heller Modus) | alle mindestens 4,5 : 1 |

Nicht geprüft:

- Echter E-Mail-Versand (in der Demo wird er simuliert)
- Dunkler Modus (Kontraste nur rechnerisch im hellen Modus geprüft)
- Bildschirmleser
- Die Ansichten der Sicherheits-Edition (Live-Lage, Streife, Vorfälle, Wächter-App) im neuen Erscheinungsbild. Die Tests dazu laufen, angesehen habe ich sie nicht
- Formulare außerhalb des Kernablaufs (Projekte, Dienstplan, Ausgaben) einzeln im Browser

## Offen vor einem Verkauf

- **Verknüpfung Anfrage ↔ Beleg.** Die Anfrage zeigt die Belege des Kunden, nicht nur die aus dieser Anfrage. Eine feste Verknüpfung braucht ein neues Datenbankfeld (Migration). Das habe ich bewusst nicht angefasst.
- **Navigation.** Die Seitenleiste hat bis zu 30 Einträge. Einklappbare Gruppen oder eine rollenabhängige Kurzfassung fehlen noch.
- **Übrige Ansichten.** Kundenakte, Projekte, Dienstplan, Berichte und Einstellungen haben das neue Erscheinungsbild, aber noch keinen „Nächster Schritt“.
- **Kanban per Tastatur.** Karten lassen sich nur mit der Maus ziehen. Per Tastatur geht der Statuswechsel über die Anfrage selbst.
- **Versionsangabe.** Im Fuß steht fest „v1.0“.
- **Messung mit echten Nutzern.** Für Aussagen zur Zeitersparnis fehlt ein Test mit zwei oder drei Betrieben.
