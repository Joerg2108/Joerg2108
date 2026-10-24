'use strict';
// Leistungskatalog Jörg Noack – wird über "Artikel & Leistungen → Leistungskatalog einspielen"
// oder "npm run catalog" in die Datenbank übernommen. Bereits vorhandene Artikelnummern bleiben unverändert.
// Preise sind Richtwerte (netto) und können jederzeit im Back Office angepasst werden.
const db = require('../db');

const CATALOG = [
  // ───────── Facility & Montage ─────────
  {
    sku: 'HM-01', category: 'Facility & Montage', name: 'Hausmeisterdienst', unit: 'Std.', price: 3900,
    description: 'Kontrollgänge, Kleinreparaturen, Pflege von Gebäuden und Außenanlagen, Mülltonnenservice, Koordination von Handwerkern (ohne meisterpflichtige Arbeiten).',
  },
  {
    sku: 'HM-02', category: 'Facility & Montage', name: 'Hausmeisterdienst – Monatspauschale', unit: 'Monat', price: 29000,
    description: 'Regelmäßige Hausmeisterbetreuung nach vereinbartem Leistungsverzeichnis, inkl. Kontrollgängen und Dokumentation.',
  },
  {
    sku: 'MO-01', category: 'Facility & Montage', name: 'Einbau genormter Baufertigteile', unit: 'Std.', price: 4500,
    description: 'Einbau genormter Baufertigteile, z. B. Fenster, Türen, Zargen, Einbauschränke und Regalsysteme – ohne Eingriff in tragende Bauteile, keine meisterpflichtigen Arbeiten.',
  },
  // ───────── Event & Ausstellung ─────────
  {
    sku: 'EV-01', category: 'Event & Ausstellung', name: 'Künstlerbetreuung', unit: 'Std.', price: 3800,
    description: 'Artist Care: Empfang, Backstage-Organisation, Transfers, Umsetzung von Ridern, Ansprechpartner vor Ort.',
  },
  {
    sku: 'EV-02', category: 'Event & Ausstellung', name: 'Künstlerbetreuung – Tagespauschale', unit: 'Tag', price: 34000,
    description: 'Ganztägige Künstlerbetreuung bis 10 Stunden inkl. Vor- und Nachbereitung.',
  },
  {
    sku: 'EV-03', category: 'Event & Ausstellung', name: 'Ausstellungsbau', unit: 'Std.', price: 4200,
    description: 'Auf- und Abbau von Ausstellungs- und Messeständen, Präsentationssystemen, Exponaten und Beschilderung.',
  },
  // ───────── Digital & Marketing ─────────
  {
    sku: 'DM-01', category: 'Digital & Marketing', name: 'Online-Marketing', unit: 'Std.', price: 6500,
    description: 'Betreiben von Online-Marketing: Kampagnenplanung und -betreuung, Website-Pflege, Newsletter, SEO/SEA, Erfolgsmessung.',
  },
  {
    sku: 'DM-02', category: 'Digital & Marketing', name: 'Online-Marketing – Monatspauschale', unit: 'Monat', price: 49000,
    description: 'Laufende Betreuung der Online-Marketing-Maßnahmen nach vereinbartem Umfang inkl. monatlichem Kurzreport.',
  },
  {
    sku: 'DM-03', category: 'Digital & Marketing', name: 'Social-Media-Kommunikation', unit: 'Std.', price: 5500,
    description: 'Redaktionsplanung, Erstellung und Veröffentlichung von Beiträgen, Community-Management und Monitoring.',
  },
  {
    sku: 'DM-04', category: 'Digital & Marketing', name: 'Social-Media-Betreuung – Monatspauschale', unit: 'Monat', price: 59000,
    description: 'Laufende Betreuung der Social-Media-Kanäle nach vereinbartem Redaktionsplan.',
  },
  {
    sku: 'DM-05', category: 'Digital & Marketing', name: 'Kundenanfragen & digitale Vertriebsunterstützung', unit: 'Std.', price: 4500,
    description: 'Beantworten von Kundenanfragen (E-Mail, Chat, Telefon), Unterstützung bei digitalen Vertriebsprozessen, Lead-Qualifizierung, CRM-Pflege, Angebotsvorbereitung.',
  },
  // ───────── Organisation & Digitalisierung ─────────
  {
    sku: 'OD-01', category: 'Organisation & Digitalisierung', name: 'Prozess- und Projektkoordination', unit: 'Std.', price: 7000,
    description: 'Planung, Steuerung und Abstimmung von Abläufen und Projekten, Terminplanung, Schnittstelle zwischen Beteiligten.',
  },
  {
    sku: 'OD-02', category: 'Organisation & Digitalisierung', name: 'Digitalisierung von Verwaltungs-, Dokumentations- und Planungsabläufen', unit: 'Std.', price: 7500,
    description: 'Analyse bestehender Abläufe, Konzeption und Umsetzung digitaler Workflows, Formulare, Ablagestrukturen und Tools.',
  },
  {
    sku: 'OD-03', category: 'Organisation & Digitalisierung', name: 'KI-Unterstützung', unit: 'Std.', price: 8500,
    description: 'Einführung und Anwendung von KI-Werkzeugen, Entwicklung von Prompts und automatisierten Workflows, Schulung von Mitarbeitenden.',
  },
  {
    sku: 'OD-04', category: 'Organisation & Digitalisierung', name: 'Einsatz- und Qualitätsplanung', unit: 'Std.', price: 6000,
    description: 'Personaleinsatz- und Schichtplanung, Qualitätsstandards, Checklisten, Kontrollen und Audits.',
  },
  {
    sku: 'OD-05', category: 'Organisation & Digitalisierung', name: 'Erstellung und Pflege von Dokumentationen', unit: 'Std.', price: 5500,
    description: 'Erstellung und laufende Pflege von Prozess-, Projekt- und Betriebsdokumentationen, Handbüchern und Nachweisen.',
  },
  {
    sku: 'OD-06', category: 'Organisation & Digitalisierung', name: 'Berichtswesen und Auswertungen', unit: 'Std.', price: 6500,
    description: 'Aufbau von Berichten und Kennzahlen, Auswertung von Bestandsdaten, regelmäßige Reports für Geschäftsführung und Auftraggeber.',
  },
];

// Spielt den Katalog ein; vorhandene Artikelnummern werden übersprungen (Preise bleiben, wie du sie gepflegt hast)
function importCatalog() {
  let added = 0;
  let skipped = 0;
  db.tx(() => {
    for (const p of CATALOG) {
      if (db.get('SELECT id FROM products WHERE sku = ?', p.sku)) { skipped++; continue; }
      db.run(
        'INSERT INTO products (sku, category, name, description, unit, price, tax_rate, active) VALUES (?, ?, ?, ?, ?, ?, 19, 1)',
        p.sku, p.category, p.name, p.description, p.unit, p.price,
      );
      added++;
    }
  });
  return { added, skipped };
}

module.exports = { CATALOG, importCatalog };

// Direkt ausführbar: npm run catalog
if (require.main === module) {
  db.open();
  const r = importCatalog();
  console.log(`Leistungskatalog: ${r.added} Leistungen angelegt, ${r.skipped} bereits vorhanden.`);
  db.close();
}
