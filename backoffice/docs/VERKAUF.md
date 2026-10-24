# Produktblatt & Verkaufsleitfaden – „Back Office“

## Elevator Pitch
> Alles, was ein Dienstleister im Büro braucht – vom Website-Kontaktformular über Angebot,
> Rechnung mit E-Rechnung und GiroCode bis zur Einsatzplanung, EÜR und DATEV-Übergabe – in **einer** Software,
> auf **eigenem Server**, ohne monatliche Abo-Kosten und DSGVO-freundlich.

## Zielgruppen
- Dienstleister mit mehreren Standbeinen – z. B. Hausmeister- und Facility-Service, Event- und Ausstellungsdienstleister
- Agenturen und Freelancer für Online-Marketing, Social Media und Vertriebsunterstützung
- Beratung für Prozesse, Digitalisierung und KI-Einführung
- Handwerksnahe Betriebe, Hausverwaltungen, Vereine und Kulturbetriebe
- Alle, die Rechnungsprogramm + CRM + Zeiterfassung + Projekt- und Einsatzplanung durch **eine** Lösung ersetzen wollen

## Praxisbeispiel: Jörg Noack Dienstleistungen
Das Back Office läuft mit dem eigenen Leistungskatalog von Jörg Noack (17 Leistungen in 4 Bereichen):
- **Facility & Montage:** Hausmeisterdienst, Einbau genormter Baufertigteile
- **Event & Ausstellung:** Künstlerbetreuung, Ausstellungsbau
- **Digital & Marketing:** Online-Marketing, Social-Media-Kommunikation, Kundenanfragen & digitaler Vertrieb
- **Organisation & Digitalisierung:** Prozess- und Projektkoordination, Digitalisierung von Abläufen, KI-Unterstützung, Einsatz- und Qualitätsplanung, Dokumentation, Berichtswesen

Damit ist das Produkt zugleich **Referenz**: Wer es kauft, sieht ein System, das im eigenen Betrieb täglich genutzt wird.

## Einsatzplanung (Highlight)
- Wochenplan mit offenen Einsätzen, Serien, „Woche kopieren“, PDF und Mailversand an die Mitarbeitenden
- Automatische Prüfung: Nachweise abgelaufen (z. B. Arbeitsschutzunterweisung, Ersthelfer, Hubarbeitsbühne)? Urlaub? Doppelt verplant? Ruhezeit/ArbZG?
- Erinnerung, bevor Nachweise ablaufen
- Nacht-/Sonntags-/Feiertagsstunden je Bundesland → CSV für die Lohnbuchhaltung
- **Einsätze mit Zuschlägen per Klick an den Kunden abrechnen**
> Vergleichbare Planungstools kosten 4–10 € pro Mitarbeiter und Monat – zusätzlich zur Buchhaltungssoftware.

## Nutzenargumente
| Statt … | … mit Back Office |
|---|---|
| 4–5 SaaS-Abos (Rechnung ≈ 15 €, CRM ≈ 25 €, Zeit ≈ 10 €, Projekte ≈ 10 € pro Nutzer/Monat) | Einmalpreis, eigene Daten, beliebig viele Nutzer |
| Website-Anfragen im Mail-Postfach | Automatisch im Vertriebs-Board mit Status & Wert |
| Excel-Mahnlisten | Mahnwesen mit 3 Stufen, PDFs & QR-Code |
| Zettelwirtschaft für Belege | Belegupload, Kategorien, EÜR, USt-Übersicht, DATEV-Export |
| Unsicherheit bei GoBD/E-Rechnung | Festschreibung, lückenlose Nummern, Audit-Log, XRechnung-Export |
| Monatspauschalen per Hand schreiben | Wiederkehrende Rechnungen für Hausmeister-, Social-Media- und Betreuungsverträge |

**Rechenbeispiel Amortisation** (3 Nutzer): SaaS-Kombi ≈ 60 €/Nutzer/Monat → 180 €/Monat → **2.160 €/Jahr**.
Back Office ab 1.500 € einmalig + Hosting (≈ 5–10 €/Monat) → amortisiert nach < 9 Monaten.

## Preis- & Paketvorschlag
| Paket | Leistung | Preis (netto) |
|---|---|---|
| **Basis** | Software-Lizenz, Installation auf Kundenserver/VPS, Einrichtung Firmendaten, Logo, Nummernkreise, 1 h Einweisung | **1.500 €** |
| **Business** | Basis + Website-Formular einbauen, SMTP, HTTPS/Domain, Datenimport (CSV), eigener Leistungskatalog, 3 h Schulung | **2.490 €** |
| **Business + Einsatzplanung** | Business + Einsatzplanung eingerichtet (Personal, Nachweise, Objekte/Projekte, Zuschlagssätze), Schulung Einsatzleitung | **3.490 €** |
| **Premium** | Business + individuelle Anpassungen (bis 8 h), DATEV-Abstimmung mit Steuerberater, Offsite-Backup | **3.900 €** |
| Wartung (optional) | Updates, Sicherheits-Patches, Backup-Kontrolle, Support per Mail | **49–99 €/Monat** |
| Hosting (optional) | Managed Server in DE inkl. Backups | **19–39 €/Monat** |

## Vorführung (Demo in 10 Minuten)
1. `npm run seed` → Demodaten aus dem eigenen Geschäft (Hausmeisterdienst, Ausstellungsbau, Social Media, Digitalisierung)
2. Dashboard zeigen (KPIs, Diagramm, überfällige Rechnungen)
3. Website-Anfrage → im Board auf „qualifiziert“ ziehen → „Als Kunde übernehmen“ → Angebot aus dem Leistungskatalog
4. Angebot → Rechnung umwandeln → Festschreiben → PDF mit GiroCode → XRechnung (Behörde mit Leitweg-ID)
5. Zahlung buchen, Mahnwesen, Stornorechnung zeigen (GoBD!)
6. Einsatzplanung: Konflikt (⚠ abgelaufene Hubarbeitsbühnen-Schulung), offene Einsätze, Woche kopieren, Stundenauswertung → „Einsätze abrechnen“
7. Stoppuhr starten, Projekt „Offene Zeiten abrechnen“
8. Berichte: EÜR, USt-Kennziffern, DATEV-Export
9. Sicherheit: 2FA, Rollen, Audit-Log „Integrität prüfen“

## Wichtige Hinweise für den Verkauf
- Keine Steuer-/Rechtsberatung versprechen – „unterstützt bei GoBD/E-Rechnung“, Verfahrensdokumentation macht der Kunde mit seinem Steuerberater.
- XRechnung vor Produktivstart mit dem KoSIT-Validator prüfen lassen.
- Lizenzvertrag schriftlich (Nutzungsumfang, Gewährleistung, Haftungsbegrenzung, Support-Umfang).
- Für Kunden aus anderen Branchen: eigenen Leistungskatalog anlegen, Kategorien und Nachweise unter Einstellungen/Personal anpassen.
