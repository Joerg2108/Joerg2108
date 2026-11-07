'use strict';
// Beitragsbank für den Instagram-Agenten: abwechselnd Demo Dienstleistung (D) und Demo Sicherheit (S).
// layout: 'shot' = Screenshot am Rechner, 'phone' = Handy-Screenshot, 'text' = reiner Textbeitrag.
// shot: Dateiname aus build/shots (svc-* = Demo Dienstleistung, sec-*/mob-* = Demo Sicherheit).

const TAGS_D = '#selbstständig #kleinunternehmen #buchhaltung #digitalisierung #dienstleister';
const TAGS_S = '#sicherheitsdienst #wachdienst #objektschutz #digitalisierung #34a';
const CTA_D = '👉 Teste die Live-Demo für Dienstleister – ohne Anmeldung: Link in Bio\n💬 Oder schreib mir „DEMO“ per DM.';
const CTA_S = '👉 Teste die Live-Demo für Sicherheitsunternehmen – ohne Anmeldung: Link in Bio\n💬 Oder schreib mir „DEMO“ per DM.';

const D = (p) => ({ demo: 'dienstleistung', ...p, caption: `${p.caption}\n\n${CTA_D}\n\n${TAGS_D}` });
const S = (p) => ({ demo: 'sicherheit', ...p, caption: `${p.caption}\n\n${CTA_S}\n\n${TAGS_S}` });

const D_POSTS = [
  D({ layout: 'text', kicker: 'Kennst du das?', title: '5 Software-Abos.<br><em>Für einen Betrieb.</em>', lead: 'Rechnung, CRM, Zeiterfassung, Projekte, Dienstplan – und trotzdem Chaos. Es geht auch mit einer Software.',
    caption: '5 Software-Abos. Für einen Betrieb. 🤯\n\nRechnungsprogramm, CRM, Zeiterfassung, Projektplanung, Dienstplan – jedes „nur“ 10–25 € im Monat. Pro Nutzer.\nUnd trotzdem: Anfragen im Postfach, Mahnungen in Excel, Belege im Schuhkarton.\n\nMein Back Office bringt alles an einen Ort. Einmal zahlen statt Abo.' }),
  D({ layout: 'shot', shot: 'svc-dash', kicker: 'Dashboard', title: 'Alles auf <em>einen Blick.</em>', bullets: ['Umsatz, offene Posten & Überfälliges', 'Neue Anfragen, Aufgaben & Termine', 'Einsatzplanung mit Warnungen'],
    caption: 'Morgens Kaffee, ein Blick – und du weißt, wo dein Betrieb steht. ☕📊\n\n✅ Umsatz im Monat und im Jahr\n✅ Offene und überfällige Rechnungen\n✅ Neue Anfragen von deiner Website\n✅ Deine Aufgaben und nächsten Termine\n\nKein Zusammensuchen aus fünf Programmen mehr.' }),
  D({ layout: 'shot', shot: 'svc-rechnungen', kicker: 'Rechnungen', title: 'Rechnung schreiben<br>in <em>1 Minute.</em>', bullets: ['Leistungen aus dem Katalog wählen', 'PDF mit GiroCode & XRechnung', 'Festschreibung nach GoBD'],
    caption: 'Rechnung schreiben in 1 Minute. ⏱️\n\nLeistung aus deinem Katalog wählen, Menge eintragen, festschreiben – fertig.\n🧾 PDF mit GiroCode (Kunde scannt und zahlt)\n🧾 E-Rechnung als XRechnung\n🧾 Lückenlose Nummern, GoBD-konform\n\nSo sieht Rechnungen schreiben 2026 aus.' }),
  D({ layout: 'text', kicker: 'Wichtig für 2027', title: 'Die E-Rechnung<br><em>kommt.</em>', lead: 'Empfangen müssen Unternehmen sie schon seit 2025 können. Ab 2027/2028 wird das Ausstellen schrittweise Pflicht. Bist du vorbereitet?',
    caption: 'Die E-Rechnung kommt – auch für kleine Betriebe. 📢\n\n📅 Seit 2025: Unternehmen müssen E-Rechnungen empfangen können.\n📅 Ab 2027/2028: Das Ausstellen wird schrittweise Pflicht.\n\nEine PDF per Mail reicht dann im B2B-Geschäft nicht mehr. Mein Back Office erzeugt die XRechnung automatisch zu jeder Rechnung.\n\nDetails zu deinem Fall klärst du am besten mit deinem Steuerberater.' }),
  D({ layout: 'shot', shot: 'svc-mahnwesen', kicker: 'Mahnwesen', title: 'Nie wieder<br><em>Geld vergessen.</em>', bullets: ['Überfällige Rechnungen automatisch erkannt', '3 Mahnstufen mit Gebühren', 'Mahnung als PDF per Klick'],
    caption: 'Wie viel Geld liegt bei dir gerade offen herum? 💸\n\nDas Back Office erkennt überfällige Rechnungen selbst und zeigt sie dir an.\n🔔 Zahlungserinnerung, 1. und 2. Mahnung\n🔔 Mit Mahngebühren und Zinsen\n🔔 PDF per Klick, direkt per Mail\n\nSchluss mit Excel-Mahnlisten.' }),
  D({ layout: 'shot', shot: 'svc-dienstplan', kicker: 'Dienstplan', title: 'Der Dienstplan,<br>der <em>mitdenkt.</em>', bullets: ['Ruhezeiten & Arbeitszeitgesetz geprüft', 'Abgelaufene Qualifikationen erkannt', 'Urlaub & Doppelbelegung sichtbar'],
    caption: 'Dein Dienstplan warnt dich, bevor es Ärger gibt. ⚠️\n\n✔ Ruhezeit unter 11 Stunden? Hinweis.\n✔ Ersthelfer-Nachweis abgelaufen? Konflikt.\n✔ Mitarbeiter im Urlaub oder doppelt verplant? Siehst du sofort.\n\nWoche kopieren, als PDF verschicken, fertig.' }),
  D({ layout: 'shot', shot: 'svc-auswertung', kicker: 'Lohn & Zuschläge', title: 'Zuschläge rechnet<br>das <em>System.</em>', bullets: ['Nacht-, Sonn- & Feiertagszuschläge', 'Minijob-Grenze im Blick', 'CSV für die Lohnbuchhaltung'],
    caption: 'Nachtarbeit, Sonntag, Feiertag – wer rechnet das bei dir aus? 🌙\n\nDie Stundenauswertung zeigt pro Mitarbeiter:\n⏱ Ist-, Soll- und Saldo-Stunden\n⏱ Nacht-, Sonn- und Feiertagsstunden (Zeitfenster nach § 3b EStG)\n⏱ Minijob-Grenze\n\nExport als CSV für deine Lohnbuchhaltung.' }),
  D({ layout: 'shot', shot: 'svc-abos', kicker: 'Abos & Verträge', title: 'Monatsrechnungen<br><em>automatisch.</em>', bullets: ['Wartungs- & Betreuungsverträge', 'Intervall einmal festlegen', 'Rechnung entsteht von selbst'],
    caption: 'Du schreibst jeden Monat dieselbe Rechnung? 🔁\n\nHausmeisterpauschale, Website-Pflege, Social-Media-Betreuung – einmal als Vorlage anlegen, Intervall wählen, fertig.\nDas Back Office erstellt die Rechnung pünktlich von selbst.\n\nMehr Zeit für deine eigentliche Arbeit.' }),
  D({ layout: 'shot', shot: 'svc-anfragen', kicker: 'Anfragen', title: 'Vom Kontaktformular<br>zum <em>Angebot.</em>', bullets: ['Website-Anfragen landen direkt im Board', 'Status & Wert jeder Anfrage', 'Ein Klick zum Angebot'],
    caption: 'Anfragen von deiner Website verschwinden im Mail-Postfach? 📩\n\nIm Back Office landen sie direkt auf dem Vertriebs-Board:\nNeu → Kontaktiert → Qualifiziert → Gewonnen\n\nMit einem Klick wird aus der Anfrage ein Angebot. Und du siehst jederzeit, wie viel Umsatz in deiner Pipeline steckt.' }),
  D({ layout: 'text', kicker: 'Rechenbeispiel', title: 'Einmal zahlen.<br><em>Nicht jeden Monat.</em>', lead: 'Abo-Kombi: ca. 2.160 € pro Jahr bei 3 Nutzern. Back Office: ab 1.500 € einmalig. Nach weniger als 9 Monaten bezahlt.',
    caption: 'Rechnen wir mal kurz. 🧮\n\nTypische Abo-Kombi bei 3 Nutzern:\nRechnung ≈ 15 € + CRM ≈ 25 € + Zeit ≈ 10 € + Projekte ≈ 10 € = 60 € pro Nutzer und Monat\n→ rund 2.160 € pro Jahr. Jedes Jahr.\n\nMein Back Office: ab 1.500 € einmalig, zzgl. Hosting.\n→ Nach weniger als 9 Monaten bezahlt. Beliebig viele Nutzer.\n\n(Rechenbeispiel mit üblichen Listenpreisen, netto.)' }),
  D({ layout: 'shot', shot: 'svc-projekte', kicker: 'Projekte', title: 'Budget, Stunden,<br><em>Aufgaben.</em>', bullets: ['Budget-Verbrauch je Projekt', 'Zeiten direkt abrechnen', 'Aufgaben & Termine im Projekt'],
    caption: 'Weißt du, ob dein Projekt gerade Geld verdient? 📁\n\nJedes Projekt im Back Office zeigt:\n📊 Wie viel vom Budget schon verbraucht ist\n⏱ Wie viele Stunden drin stecken\n✅ Welche Aufgaben noch offen sind\n\nUnd die erfassten Zeiten rechnest du mit einem Klick ab.' }),
  D({ layout: 'shot', shot: 'svc-berichte', kicker: 'Berichte & DATEV', title: 'Dein Steuerberater<br>wird dich <em>lieben.</em>', bullets: ['EÜR & Umsatzsteuer-Übersicht', 'Belege mit Kategorien', 'DATEV-Export per Klick'],
    caption: 'Schuhkarton voller Belege zum Steuerberater? 📦 Das war einmal.\n\n📊 Einnahmen-Überschuss-Rechnung\n📊 Umsatzsteuer-Übersicht\n📊 Belege hochladen und kategorisieren\n📊 DATEV-Export für den Steuerberater\n\nAm Monatsende ein Klick statt eines Nachmittags.' }),
  D({ layout: 'shot', shot: 'svc-benutzer', kicker: 'Rollen & Datenschutz', title: 'Jeder sieht,<br>was er <em>braucht.</em>', bullets: ['Rollen: Chef, Buchhaltung, Mitarbeiter', 'Zwei-Faktor-Login', 'Protokoll & Backups'],
    caption: 'Nicht jeder im Team muss alles sehen. 🔐\n\n👤 Geschäftsführung: alles\n👤 Buchhaltung: Rechnungen, Ausgaben, DATEV\n👤 Mitarbeiter: eigene Schichten, Zeiten, Aufgaben\n\nDazu Zwei-Faktor-Login, Protokoll jeder Änderung und Backups. Und deine Daten liegen auf deinem eigenen Server.' }),
  D({ layout: 'text', kicker: 'Probier es aus', title: 'Teste die<br><em>Live-Demo.</em>', lead: 'Ohne Anmeldung. Mit Musterdaten. Einfach eine Rolle anklicken – Geschäftsführung, Buchhaltung oder Mitarbeiter.',
    caption: 'Genug gelesen – probier es selbst aus! 🚀\n\nDie Live-Demo zeigt die Muster Service GmbH mit echten Beispieldaten:\nKunden, Rechnungen, Mahnungen, Dienstplan, Projekte.\n\nKeine Anmeldung, kein Formular. Rolle anklicken und loslegen. Alles darf ausprobiert werden – alle 6 Stunden wird zurückgesetzt.' }),
];

const S_POSTS = [
  S({ layout: 'text', kicker: 'Für Sicherheitsunternehmen', title: 'Wachbuch auf Papier?<br><em>Das war gestern.</em>', lead: 'Streife, Vorfälle, Dienstplan und Rechnung – in einer Software. Für Wach- und Sicherheitsdienste.',
    caption: 'Wachbuch auf Papier, Dienstplan in Excel, Rechnungen in Word? 📋\n\nMein Back Office für Sicherheitsunternehmen bringt alles zusammen:\n🛡 Objekte und Kontrollpunkte\n🛡 Streife mit digitalem Wachbuch\n🛡 Vorfälle mit Bericht für den Kunden\n🛡 Dienstplan, Zuschläge, Rechnung\n\nEinmal zahlen statt Abo.' }),
  S({ layout: 'shot', shot: 'sec-lage', kicker: 'Live-Lage', title: 'Was läuft<br><em>gerade?</em>', bullets: ['Laufende Streifen in Echtzeit', 'Wer ist im Dienst?', 'Offene Vorfälle auf einen Blick'],
    caption: 'Einsatzleitung, aufgepasst. 👀\n\nDie Live-Lage zeigt dir auf einen Blick:\n🟢 Welche Streife gerade läuft – mit jedem Wachbucheintrag\n⏱ Wer eingestempelt und im Dienst ist\n⚠️ Welche Vorfälle noch offen sind\n\nAktualisiert sich automatisch. Kein Rumtelefonieren mehr.' }),
  S({ layout: 'shot', shot: 'sec-streife', kicker: 'Streife & Wachbuch', title: 'Lückenlos<br><em>dokumentiert.</em>', bullets: ['Rundgänge mit Kontrollpunkten', 'Jeder Eintrag mit Uhrzeit', 'Abgeschlossene Streifen im Archiv'],
    caption: 'Wenn der Kunde fragt: „Wann war Ihr Mitarbeiter da?“ 🕐\n\nMit dem digitalen Wachbuch hast du die Antwort sofort:\n✔ Jeder Rundgang mit Uhrzeit\n✔ Jeder Kontrollpunkt und jede Notiz\n✔ Laufende und abgeschlossene Streifen\n\nLückenlos und nachvollziehbar.' }),
  S({ layout: 'shot', shot: 'sec-objekte', kicker: 'Objekte', title: 'Jedes Objekt.<br><em>Alle Infos.</em>', bullets: ['Ansprechpartner & Dienstanweisung', 'Kontrollpunkte je Objekt', 'Aktuelle Lage pro Objekt'],
    caption: 'Neuer Mitarbeiter, neues Objekt – und keiner weiß, was zu tun ist? 🏢\n\nIm Back Office hat jedes Objekt:\n📍 Adresse und Ansprechpartner\n📍 Dienstanweisungen („Tiefgarage um 22 Uhr schließen“)\n📍 Anzahl der Kontrollpunkte\n📍 Laufende Streifen und offene Vorfälle\n\nAlles an einem Ort, für jeden im Team.' }),
  S({ layout: 'shot', shot: 'sec-vorfaelle', kicker: 'Vorfälle', title: 'Vom Vorfall<br>zum <em>Bericht.</em>', bullets: ['Melden direkt vom Handy', 'Schwere, Kategorie, Status', 'Bericht für den Kunden'],
    caption: 'Fehlalarm, Diebstahl, Hausverbot – was passiert danach? 🚨\n\n1️⃣ Der Mitarbeiter meldet den Vorfall direkt vom Handy\n2️⃣ Die Einsatzleitung sieht ihn sofort\n3️⃣ Bearbeiten, Maßnahmen eintragen, abschließen\n4️⃣ Bericht für den Kunden ausgeben\n\nProfessionell und nachvollziehbar.' }),
  S({ layout: 'phone', shot: 'mob-waechter', kicker: 'Wächter-App', title: 'Alles in der<br><em>Hosentasche.</em>', bullets: ['Einstempeln am Einsatzort', 'Streife & Wachbuch führen', 'Vorfall melden mit einem Tipp'],
    caption: 'So sieht es dein Mitarbeiter auf dem Handy. 📱\n\n👆 Einstempeln am Einsatzort\n👆 Streife starten und Wachbuch führen\n👆 Vorfall melden\n👆 Nächste Schichten ansehen\n\nKeine App aus dem Store nötig – läuft direkt im Browser.' }),
  S({ layout: 'shot', shot: 'sec-dienstplan', kicker: 'Dienstplan', title: 'Kein Einsatz<br>ohne <em>Nachweis.</em>', bullets: ['Abgelaufene Qualifikationen erkannt', 'Ruhezeiten & Arbeitszeitgesetz', 'Offene Schichten sichtbar'],
    caption: 'Ersthelfer-Nachweis abgelaufen – und der Mitarbeiter steht trotzdem im Plan? ⚠️\n\nDer Dienstplan schlägt Alarm:\n✔ Fehlende oder abgelaufene Qualifikationen\n✔ Ruhezeit unter 11 Stunden\n✔ Urlaub oder Doppelbelegung\n✔ Offene Schichten, die noch besetzt werden müssen\n\nSo planst du sicher – im wahrsten Sinne.' }),
  S({ layout: 'shot', shot: 'sec-auswertung', kicker: 'Zuschläge', title: 'Nachtdienst?<br><em>Rechnet sich.</em>', bullets: ['Nacht-, Sonn- & Feiertagsstunden', 'CSV für die Lohnbuchhaltung', 'Einsätze an Kunden abrechnen'],
    caption: 'Im Sicherheitsdienst ist Nacht und Wochenende Alltag. 🌙\n\nDie Stundenauswertung zeigt pro Mitarbeiter:\n⏱ Nachtstunden (20–6 Uhr, davon 0–4 Uhr)\n⏱ Sonntags- und Feiertagsstunden\n⏱ Ist, Soll und Saldo\n\nAls CSV für die Lohnbuchhaltung – und die Einsätze rechnest du mit Zuschlägen direkt beim Kunden ab.' }),
  S({ layout: 'shot', shot: 'sec-fahrzeuge', kicker: 'Fahrzeuge', title: 'Der Fuhrpark<br><em>im Griff.</em>', bullets: ['Kilometerstand & Fahrer', 'HU-Termine mit Warnung', 'Status: im Einsatz, verfügbar, Werkstatt'],
    caption: 'Streifenwagen mit abgelaufener HU? Muss nicht sein. 🚗\n\nIm Back Office siehst du für jedes Fahrzeug:\n🔧 Kilometerstand und Fahrer\n🔧 HU-Termin – mit Warnung, wenn er abläuft\n🔧 Versicherung\n🔧 Status: im Einsatz, verfügbar oder in der Werkstatt' }),
  S({ layout: 'shot', shot: 'sec-rechnungen', kicker: 'Abrechnung', title: 'Einsatz gefahren.<br><em>Rechnung raus.</em>', bullets: ['Schichten per Klick abrechnen', 'XRechnung & GiroCode', 'Mahnwesen mit 3 Stufen'],
    caption: 'Vom Einsatz zur Rechnung – ohne Abtippen. 🧾\n\nDie geleisteten Schichten eines Objekts rechnest du per Klick ab: Stunden × Stundensatz, plus Nacht-, Sonn- und Feiertagszuschläge.\n\nDazu E-Rechnung (XRechnung), GiroCode und Mahnwesen mit 3 Stufen. Abgerechnete Schichten werden gesperrt – nichts wird doppelt berechnet.' }),
  S({ layout: 'shot', shot: 'sec-personal', kicker: 'Personal', title: 'Nachweise immer<br><em>im Blick.</em>', bullets: ['Warnung vor Ablauf von Nachweisen', 'Beschäftigungsart & Wochenstunden', 'Alle Mitarbeiterdaten an einem Ort'],
    caption: '§ 34a, Ersthelfer, Unterweisung, Hubarbeitsbühne – wann läuft was ab? 📅\n\nDas Back Office warnt dich 60 Tage vorher, wenn ein Nachweis abläuft. Und zeigt rot an, was schon abgelaufen ist.\n\nDazu für jeden Mitarbeiter: Beschäftigungsart, Wochenstunden, Kontakt und alle Qualifikationen.' }),
  S({ layout: 'text', kicker: 'Rechenbeispiel', title: 'Planungstool im Abo?<br><em>Pro Kopf.</em>', lead: 'Dienstplan-Tools kosten oft 4–10 € pro Mitarbeiter und Monat – zusätzlich zur Buchhaltung. Das Back Office: einmal zahlen, beliebig viele Mitarbeiter.',
    caption: 'Je mehr Mitarbeiter, desto teurer das Abo. 📈\n\nViele Dienstplan- und Wachbuch-Tools kosten 4–10 € pro Mitarbeiter und Monat. Bei 20 Wachleuten sind das schnell 1.000–2.400 € im Jahr – nur für die Planung, ohne Rechnung und Buchhaltung.\n\nMein Back Office: einmal zahlen, beliebig viele Nutzer, alles in einer Software.\n\n(Rechenbeispiel mit üblichen Listenpreisen, netto.)' }),
  S({ layout: 'phone', shot: 'mob-streife', kicker: 'Wachbuch mobil', title: 'Rundgang?<br><em>Ein Tipp.</em>', bullets: ['Rundgang & Kontrollpunkte eintragen', 'Notizen mit Uhrzeit', 'Streife beenden'],
    caption: 'Wachbuch führen am Handy – so einfach geht es. ✍️\n\n1️⃣ Streife starten\n2️⃣ Bei jedem Rundgang tippen\n3️⃣ Kontrollpunkt oder Notiz eintragen („Tor 3 kontrolliert“)\n4️⃣ Streife beenden\n\nAlles landet sofort in der Live-Lage bei der Einsatzleitung.' }),
  S({ layout: 'text', kicker: 'Probier es aus', title: 'Teste die<br><em>Live-Demo.</em>', lead: 'Muster Sicherheit GmbH mit Objekten, Streifen, Vorfällen und Dienstplan. Ohne Anmeldung – einfach eine Rolle anklicken.',
    caption: 'Überzeug dich selbst! 🚀\n\nDie Live-Demo zeigt die Muster Sicherheit GmbH mit Beispieldaten:\nObjekte, laufende Streife, Vorfälle, Fahrzeuge, Dienstplan und Rechnungen.\n\nKeine Anmeldung. Rolle anklicken und loslegen – als Geschäftsführung oder als Mitarbeiter mit der Wächter-App.' }),
];

// Abwechselnd: D, S, D, S …
const POSTS = [];
for (let i = 0; i < Math.max(D_POSTS.length, S_POSTS.length); i++) {
  if (D_POSTS[i]) POSTS.push(D_POSTS[i]);
  if (S_POSTS[i]) POSTS.push(S_POSTS[i]);
}
POSTS.forEach((p, i) => { p.id = String(i + 1).padStart(3, '0'); });

module.exports = { POSTS };
