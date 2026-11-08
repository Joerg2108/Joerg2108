# Übergabe-Checkliste fischer-art.de (NOIR CHROMA)

Stand: 07.11.2026 · Vorschau: https://fischer-art.netlify.app · Branch `claude/practical-ramanujan-bk8uem`

---

## 1. Testergebnisse

| Test | Umfang | Ergebnis |
|---|---|---|
| Interne Links + Anker | alle 55 Seiten (DE/EN/ZH), jedes `href`, jede `#id` | ✅ 0 kaputte Links |
| Bilder, Videos, Poster | alle referenzierten Dateien in `out/` | ✅ alles vorhanden |
| JavaScript-Fehler | Playwright, Desktop 1440 px + Mobil 390 px | ✅ 0 Fehler |
| Seitlicher Überlauf (Mobil) | alle Seiten | ✅ keiner (nach Fix) |
| Barrierefreiheit (axe-core, WCAG 2.1 AA) | alle Seiten | ✅ 0 Verstöße |
| hreflang / canonical / `lang` | alle Seiten | ✅ vollständig (außer `/404/`, gewollt) |
| sitemap.xml / robots.txt | 15 Seiten × 3 Sprachen = 45 URLs | ✅ vorhanden |
| Externe Links (Instagram, Facebook, Shop) | – | ⚠️ in der Test-Umgebung nicht erreichbar → **manuell prüfen** (s. u.) |

### Lighthouse (Mobil, gedrosselt, lokaler Server ohne Kompression)

| Seite | Performance | Barrierefreiheit | Best Practices | SEO |
|---|---|---|---|---|
| `/de/` vorher | 34 | 96 | 100 | 100 |
| `/de/` **nachher** | **70** | **100** | 100 | 100 |
| `/de/werk/portraets/` | 67 | 96 → 100* | 100 | 100 |
| `/de/kunst-am-bau/` | 70 | 96 → 100* | 100 | 100 |

\* gleiche Fixes (Logo-Label, Footer-Linkgröße) wirken auf allen Seiten.

Startseite: Blockierzeit (TBT) **139 s → 0,09 s**, Seitengewicht 3,9 → 3,1 MB.
Auf Netlify kommen Brotli/Gzip dazu (lokal rund 800 KB unkomprimiert), live sollte der Wert also noch besser ausfallen.

---

## 2. Bereits behoben

- [x] Header hat Klicks/Maus über der ganzen Seite abgefangen → `pointer-events` korrigiert
- [x] Footer wieder rot (Preset *vermilion*)
- [x] Seitlicher Überlauf auf `/person/` (Mobil)
- [x] Überschriften-Reihenfolge im Footer (h3 → h2)
- [x] Shop-Link im Fließtext als Link erkennbar (unterstrichen)
- [x] Doppelte Seite `/werk/kunst-am-bau/` entfernt, 301 auf `/kunst-am-bau/`
- [x] Nicht-gefunden-Seiten mit Titel + `noindex`
- [x] `sitemap.xml` + `robots.txt` erzeugt
- [x] 3D-Szene lädt auf Handys/schwachen Geräten erst nach erster Interaktion (spart ~600 KB JS)
- [x] Hero-Text als reine CSS-Animation (wartet nicht mehr auf JavaScript)
- [x] Logo: Screenreader-Name passt zum sichtbaren Text
- [x] Footer-Links mit mind. 24 px Klickhöhe (WCAG 2.2 Target Size)

---

## 3. Offene Punkte – priorisiert

### 🔴 Muss vor dem Launch

1. **Shop-Link klären.** `http://fischer-art-shop.de` war nicht auflösbar, und die alte Seite sagt „künftig“.
   → Gibt es den Shop? Wenn ja, auf `https://` umstellen (`lib/content/*.ts` → `shopUrl`); wenn nein, den Link ausblenden.
2. **Instagram/Facebook-Links im Browser anklicken.** Sie sind korrekt eingetragen, konnten hier aber nicht abgerufen werden.
3. **Rechtstexte prüfen lassen.** In Impressum und Datenschutz steht noch der Entwurfshinweis (`lib/legal.ts` → `LEGAL_TEXTS_REVIEWED = false`).
   - Netlify als Hoster in die Datenschutzerklärung aufnehmen (Server in den USA → Art. 44 ff. DSGVO, EU-US Data Privacy Framework)
   - AV-Vertrag (DPA) mit Netlify abschließen (Netlify-Dashboard → Team → Legal)
   - Erst danach den Schalter auf `true` setzen
4. **Domain umziehen.** `www.fischer-art.de` zeigt noch auf die alte WordPress-Seite.
   - Netlify → *Domain management* → Domain hinzufügen
   - DNS beim Provider: `www` als CNAME auf `fischer-art.netlify.app`, Apex per A-Record auf `75.2.60.5`
   - SSL wird automatisch eingerichtet
   - Danach stimmen canonical, Sitemap und hreflang automatisch, weil sie bereits auf `https://www.fischer-art.de` zeigen.
5. **Alte WordPress-URLs nach dem Umzug live testen** (301-Weiterleitungen in `public/_redirects`), z. B.:
   ```bash
   curl -sI https://www.fischer-art.de/vita/ | head -3
   ```
6. **Kontaktwege testen:** mailto-Link, Telefonlink auf dem Handy und Kontaktformular (falls aktiviert, s. u.).

### 🟠 Sollte bald passieren

7. **Übersetzungen muttersprachlich gegenlesen**, vor allem Chinesisch: maschinennah übersetzt, Kunstfachbegriffe prüfen.
8. **Veraltete Inhalte aktualisieren:**
   - Kalender-Hinweise 2021/2023
   - Ausstellungsliste endet 2019
   - „Aktuelles“ steht auf 04/2026
9. **Google Search Console:** Domain verifizieren und `https://www.fischer-art.de/sitemap.xml` einreichen. Dasselbe in den Bing Webmaster Tools.
10. **Test auf echten Geräten:** iPhone (Safari), Android (Chrome), iPad, ein langsames Gerät. Simulatoren ersetzen das nicht.
11. ~~Bilder responsiv ausliefern~~ ✅ erledigt: Jedes Bild gibt es in 320/640/960/1280/1920 px, `srcset` über `lib/image-loader.ts`.
    Ergebnis: Bilddaten am Desktop 68–82 % weniger, am Handy je nach Seite 0–41 %. Hochauflösende Handys laden bewusst große Varianten.
    Der Lighthouse-Wert ändert sich dadurch kaum; mobil bremsen JavaScript und das Hero-Video, nicht die Bilder.
    Neue Bilder einfach nach `public/images/` legen, die Varianten entstehen beim Build automatisch.

12a. ~~YouTube-Titel eintragen~~ ✅ erledigt (Titel, Kanal und Original-Vorschaubilder lokal).

### 🟢 Optional / Ausbau

12. **Echte Filmaufnahmen** (Atelier, Fassaden, Prozess) statt Ken-Burns-Clips aus Fotos, siehe Videoplan in `docs/DESIGN-SYSTEM.md`.
13. **Kundenstimmen** nur mit schriftlicher Freigabe der zitierten Personen.
14. **Kontaktformular über Netlify Forms**: kein Backend nötig, Spam-Schutz per Honeypot. Muss dann in den Datenschutz aufgenommen werden.
15. **Statistik** nur mit Consent-Banner, oder cookielos (z. B. Plausible bzw. Netlify Analytics serverseitig) und dann ohne Banner.
16. **Videos weiter verkleinern:** Hero mobil nur als Poster, Film erst ab WLAN bzw. Desktop.
17. **Strukturierte Daten** (Schema.org `Person`/`VisualArtwork`) für bessere Google-Darstellung.
18. **Open-Graph-Bilder pro Seite**, damit Teilen auf WhatsApp/Facebook schön aussieht.

---

## 4. Tests selbst wiederholen

```bash
cd web
rm -rf .next out && npm run build
npx serve out -l 3124
```

```bash
npx lighthouse http://localhost:3124/de/ --view
```

Online, nach dem Domain-Umzug: https://pagespeed.web.dev und https://validator.w3.org/checklink
