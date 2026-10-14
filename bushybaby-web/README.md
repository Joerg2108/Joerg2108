# BushyBaby Tiki Pub — Website

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript · Motion · **English + German**.
Design reference: the "BushyBaby Tiki Pub — Website Redesign" canvas (boards 01 Home, 05 Visit, 12 Design system, 13 Motion).

## Quick start

```bash
cd bushybaby-web
npm install
cp .env.example .env.local   # set site URL + WhatsApp number
npm run dev                  # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build && npm start` | Production build + server |
| `npm run build:upload` | Static folder + zip for Netlify drag-and-drop |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests for language detection, WhatsApp message + JSON-LD (Node test runner, no deps) |

## Upload folder for Netlify drag-and-drop (no Git, no CLI)

```bash
npm run build:upload        # → netlify-upload/  and  netlify-upload.zip
```

Unzip and drag the **netlify-upload** folder onto the project's *Deploys* page
(https://app.netlify.com/projects/bushybaby-tikipub/deploys) — or onto https://app.netlify.com/drop.

This is a fully static export (`STATIC_EXPORT=1`, see `scripts/build-upload.mjs`). Server-only
features are replaced by Netlify rules written into the folder:

| Server build | Upload folder |
|---|---|
| `proxy.ts` language redirect | `_redirects`: `Cookie=bb_lang_en/de` (EN \| DE switch) → `Language=de` → English |
| `[...rest]` localized 404 | `_redirects`: `/de/*` → `/de/lost` (404), everything else → `/en/lost` (404) |
| `next/image` optimizer | original images (`images.unoptimized`) |
| — | `_headers`: security headers + long cache for `/_next/static` |

The site URL is baked in at build time (`NEXT_PUBLIC_SITE_URL`, default `https://bushybaby-tikipub.netlify.app`).
Rebuild the folder after every content change — it's a snapshot, not connected to Git.

## Before going live — fill in your data

Everything about the business lives in **`lib/site.ts`**. Fields that are `null` are
**left out of Google's structured data automatically** (no placeholders ever reach Google):

- `address` (street, town, region) and `geo` (lat/lng from Google Maps)
- `openingHours` — e.g. `{ days: ["Fr", "Sa"], opens: "17:00", closes: "02:00" }`
- `phoneDisplay`, `email`, `priceRange`, `paymentAccepted`, `foundingYear`

All copy (drinks, prices, FAQ, reviews …) lives in **`content/dictionaries/en.ts`** and **`de.ts`**.
Text in `[brackets]` is a placeholder. The reviews section stays hidden until you add real reviews (with the guest's permission).

## Languages (EN / DE)

| URL | What happens |
|---|---|
| `/en/…`, `/de/…` | Every page exists in both languages, both prerendered at build time. |
| `/` or `/reserve` (no prefix) | `proxy.ts` redirects (307): **1)** language-switch cookie `NEXT_LOCALE`, **2)** browser `Accept-Language` (de-AT, de-CH → de), **3)** English. |
| EN \| DE switch in the nav | Stays on the same page (`/de/reserve` ⇄ `/en/reserve`) and remembers the choice for a year. |

- **Adding/changing text:** edit the key in `en.ts` *and* `de.ts`. `de.ts` is typed against `en.ts`, so a
  missing or extra key fails `npm run typecheck` — no half-translated pages can ship.
- **German is ~30 % longer than English.** Check big headlines in both languages after edits
  (that's why the German hero reads "Hellwach / bei Nacht." instead of a literal translation).
- **WhatsApp:** the reservation message to the bar is always **English** (the crew's language);
  German guests get an extra line `Guest language: German` so the crew knows how to reply.
- **SEO:** each page sends `<html lang>`, `canonical`, `hreflang` for en/de + `x-default` (→ en),
  `og:locale`, a localized `BarOrPub` description (same `@id` in both languages) and a localized `FAQPage`.
  The sitemap lists both languages with `xhtml:link` alternates.
- **Adding a third language** (e.g. `fr`): add it to `locales` in `lib/i18n.ts`, create
  `content/dictionaries/fr.ts` typed as `Dictionary`, register it in `content/dictionaries/index.ts`,
  add `fr` names to `formatDay` in `lib/whatsapp.ts`.

## How reservations work (WhatsApp, no backend)

`/reserve` → guest picks day, time, guests, name → **"Send on WhatsApp"** opens a chat with
the pub's number and a pre-filled message:

```
Hi BushyBaby! I'd like to reserve a table.

Day: Fri 16 Oct
Time: 20:00
Guests: 4
Name: Jörg
Note: Birthday
```

The guest lands on `/reserve/thanks` (ticket, "Add to calendar", directions). The host confirms
inside WhatsApp. Nothing is stored on the website → no database, no GDPR/KDPA data storage on the site.
Logic: `lib/whatsapp.ts` (tested in `lib/whatsapp.test.ts`).

**Upgrade path:** WhatsApp Business app (free: quick replies, labels "requested/confirmed") →
later WhatsApp Cloud API + the host dashboard from canvas board 08 if volume grows.

## SEO

- **JSON-LD `BarOrPub`** in every page (`lib/schema.ts`): name, images, Instagram, reservation action,
  plus address / geo / opening hours / phone as soon as they're filled in.
- **JSON-LD `FAQPage`** on the homepage (only answers without placeholders).
- Metadata, Open Graph + Twitter card, canonical URLs, `sitemap.xml`, `robots.txt`, favicon (`app/icon.svg`).
- Validate after deploy: <https://search.google.com/test/rich-results> and <https://validator.schema.org>.
- Biggest local-SEO lever is outside the code: a complete **Google Business Profile** with the same
  name, address, hours and phone as `lib/site.ts`.

## Structure

```
proxy.ts                language redirect (Next 16's name for middleware)
app/
  [lang]/layout.tsx     <html lang>, fonts, metadata + hreflang, JSON-LD, nav/footer
  [lang]/page.tsx       homepage (+ FAQPage schema)
  [lang]/reserve/       reservation form → WhatsApp, thanks page
  [lang]/not-found.tsx  localized 404 ([...rest] routes unknown paths here)
  sitemap.ts robots.ts icon.svg
components/
  home/                 homepage sections + FAQ accordion
  magicui/              lean ports of Magic UI (ShimmerButton, AuroraText, Marquee, MagicCard, BorderBeam, DotPattern)
  site/                 nav (incl. mobile sheet), footer, logo + icons
  reveal.tsx            scroll reveal + CSS word-rise, reduced-motion aware
content/dictionaries/  en.ts (reference) + de.ts — all copy
content/shared.ts       language-independent data (image paths, act times)
lib/                    site data, i18n, SEO, WhatsApp + schema logic and tests
```

## Not built yet

`/[lang]/menu`, `/nights`, `/story`, `/journal`, `/faq`, `/legal/*` are linked but not implemented yet
(canvas boards 02–07). Add each to `app/sitemap.ts` when it exists, and `hasMenu` in `lib/schema.ts` once `/menu` is live.

## Accessibility & performance notes

- WCAG AA contrast (muted text #a1a1a1 on #0a0a0a = 7.9:1), visible amber focus ring, skip link,
  real buttons/labels, `aria-expanded` accordion, mobile sheet closes on Esc.
- `prefers-reduced-motion` disables all loops and reveals.
- Hero headline animates with pure CSS → visible without JS, good LCP. Images via `next/image` (AVIF/WebP).
- Fonts are self-hosted via the `geist` package (no Google Fonts request).
