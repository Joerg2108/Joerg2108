'use strict';
// Leistungskataloge – werden über "Artikel & Leistungen → Leistungskatalog einspielen"
// oder "npm run catalog" in die Datenbank übernommen. Bereits vorhandene Artikelnummern bleiben unverändert.
// Preise sind Richtwerte (netto) und können jederzeit im Back Office angepasst werden.
//   standard: Leistungskatalog Jörg Noack
//   muster:   neutraler Musterkatalog (Demo-Modus, Vorführungen) – Auswahl per CATALOG=muster
const db = require('../db');
const config = require('../config');

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

const MUSTER_CATALOG = [
  // ───────── Beratung & Projekte ─────────
  { sku: 'BP-01', category: 'Beratung & Projekte', name: 'Beratung', unit: 'Std.', price: 9500, description: 'Fachliche Beratung vor Ort oder per Video, inkl. kurzer Ergebniszusammenfassung.' },
  { sku: 'BP-02', category: 'Beratung & Projekte', name: 'Projektmanagement', unit: 'Std.', price: 8500, description: 'Planung, Steuerung und Abstimmung von Projekten, Termin- und Budgetkontrolle, Statusberichte.' },
  { sku: 'BP-03', category: 'Beratung & Projekte', name: 'Workshop – Tagessatz', unit: 'Tag', price: 98000, description: 'Ganztägiger Workshop bis 8 Stunden inkl. Vorbereitung und Fotoprotokoll.' },
  { sku: 'BP-04', category: 'Beratung & Projekte', name: 'Prozessanalyse & Digitalisierung', unit: 'Std.', price: 9000, description: 'Aufnahme bestehender Abläufe, Schwachstellenanalyse und Konzept für digitale Workflows.' },
  // ───────── Service & Wartung ─────────
  { sku: 'SW-01', category: 'Service & Wartung', name: 'Servicetechniker', unit: 'Std.', price: 6800, description: 'Service-, Wartungs- und Reparaturarbeiten durch geschulte Fachkräfte.' },
  { sku: 'SW-02', category: 'Service & Wartung', name: 'Wartungsvertrag – Monatspauschale', unit: 'Monat', price: 24900, description: 'Regelmäßige Wartung nach Leistungsverzeichnis inkl. Prüfprotokoll und bevorzugter Störungsannahme.' },
  { sku: 'SW-03', category: 'Service & Wartung', name: 'Anfahrtspauschale', unit: 'pauschal', price: 4500, description: 'Anfahrt im Stadtgebiet inkl. Fahrzeit.' },
  { sku: 'SW-04', category: 'Service & Wartung', name: 'Notdienst-Zuschlag', unit: 'pauschal', price: 8000, description: 'Zuschlag für Einsätze außerhalb der Geschäftszeiten, an Wochenenden und Feiertagen.' },
  // ───────── Montage & Technik ─────────
  { sku: 'MT-01', category: 'Montage & Technik', name: 'Montage', unit: 'Std.', price: 6200, description: 'Montage und Installation von Bauteilen, Geräten und Ausstattung.' },
  { sku: 'MT-02', category: 'Montage & Technik', name: 'Kleinmaterial', unit: 'pauschal', price: 2500, description: 'Befestigungs- und Verbrauchsmaterial.' },
  { sku: 'MT-03', category: 'Montage & Technik', name: 'Inbetriebnahme & Einweisung', unit: 'Std.', price: 7200, description: 'Funktionsprüfung, Einstellung und Einweisung der Nutzer inkl. Übergabeprotokoll.' },
  // ───────── Digital & Marketing ─────────
  { sku: 'DM-01', category: 'Digital & Marketing', name: 'Webdesign & Umsetzung', unit: 'Std.', price: 9000, description: 'Gestaltung und Umsetzung von Websites und Landingpages, responsiv und barrierearm.' },
  { sku: 'DM-02', category: 'Digital & Marketing', name: 'Website-Pflege – Monatspauschale', unit: 'Monat', price: 14900, description: 'Updates, Sicherheits-Checks, Backups und kleine Inhaltsänderungen.' },
  { sku: 'DM-03', category: 'Digital & Marketing', name: 'Social-Media-Betreuung – Monatspauschale', unit: 'Monat', price: 49000, description: 'Redaktionsplan, Beitragserstellung, Community-Management und Monatsreport.' },
  { sku: 'DM-04', category: 'Digital & Marketing', name: 'Hosting & Domain', unit: 'Jahr', price: 18000, description: 'Webhosting mit SSL-Zertifikat, E-Mail-Postfächern und täglicher Sicherung.' },
  // ───────── Schulung ─────────
  { sku: 'SC-01', category: 'Schulung', name: 'Schulung vor Ort – Tagessatz', unit: 'Tag', price: 89000, description: 'Praxisschulung für bis zu 10 Teilnehmende inkl. Unterlagen und Teilnahmebescheinigung.' },
  { sku: 'SC-02', category: 'Schulung', name: 'Online-Schulung', unit: 'Std.', price: 12000, description: 'Live-Schulung per Video inkl. Aufzeichnung.' },
];

const CATALOGS = { standard: CATALOG, muster: MUSTER_CATALOG };

// Demo-Instanzen nutzen immer den neutralen Musterkatalog
function active() {
  return CATALOGS[config.demo.enabled ? 'muster' : process.env.CATALOG] || CATALOG;
}

// Spielt den Katalog ein; vorhandene Artikelnummern werden übersprungen (Preise bleiben, wie du sie gepflegt hast)
function importCatalog(items = active()) {
  let added = 0;
  let skipped = 0;
  db.tx(() => {
    for (const p of items) {
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

// Öffentliche Sicht auf den Katalog (Website): nur aktive, freigegebene Leistungen, Preise nur wenn erlaubt
function publicCatalog() {
  const s = require('./settings').all();
  const showPrices = s.public_show_prices === '1';
  const rows = db.all("SELECT sku, category, name, description, unit, price FROM products WHERE active = 1 AND public = 1 ORDER BY COALESCE(category, 'zzz'), sku, name");
  const categories = new Map();
  for (const r of rows) {
    const cat = r.category || 'Weitere Leistungen';
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat).push({
      sku: r.sku, name: r.name, description: r.description || '', unit: r.unit,
      ...(showPrices ? { price: r.price / 100, currency: 'EUR', price_note: 'netto zzgl. USt' } : {}),
    });
  }
  return {
    company: s.company_name, website: s.company_website, intro: s.public_catalog_intro, contact_url: s.public_contact_url,
    show_prices: showPrices, categories: [...categories].map(([name, items]) => ({ name, items })),
  };
}

module.exports = { CATALOG, MUSTER_CATALOG, CATALOGS, active, importCatalog, publicCatalog };

// Direkt ausführbar: npm run catalog
if (require.main === module) {
  db.open();
  const r = importCatalog();
  console.log(`Leistungskatalog: ${r.added} Leistungen angelegt, ${r.skipped} bereits vorhanden.`);
  db.close();
}
