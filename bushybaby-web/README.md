# BushyBaby Tiki Pub — Website

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript · Motion.
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
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests for WhatsApp message + JSON-LD (Node test runner, no deps) |

## Before going live — fill in your data

Everything about the business lives in **`lib/site.ts`**. Fields that are `null` are
**left out of Google's structured data automatically** (no placeholders ever reach Google):

- `address` (street, town, region) and `geo` (lat/lng from Google Maps)
- `openingHours` — e.g. `{ days: ["Fr", "Sa"], opens: "17:00", closes: "02:00" }`
- `phoneDisplay`, `email`, `priceRange`, `paymentAccepted`, `foundingYear`

Copy (drinks, prices, FAQ, reviews) lives in **`content/home.ts`**. Text in `[brackets]` is a placeholder.
The reviews section stays hidden until you add real reviews (with the guest's permission).

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
app/
  layout.tsx            fonts, metadata, JSON-LD, nav/footer
  page.tsx              homepage (+ FAQPage schema)
  reserve/              reservation form → WhatsApp, thanks page
  sitemap.ts robots.ts not-found.tsx icon.svg
components/
  home/                 homepage sections + FAQ accordion
  magicui/              lean ports of Magic UI (ShimmerButton, AuroraText, Marquee, MagicCard, BorderBeam, DotPattern)
  site/                 nav (incl. mobile sheet), footer, logo + icons
  reveal.tsx            scroll reveal + CSS word-rise, reduced-motion aware
content/home.ts         all homepage copy
lib/                    site data, WhatsApp + schema logic and tests
```

## Not built yet

`/menu`, `/nights`, `/story`, `/journal`, `/faq`, `/legal/*` are linked but not implemented yet
(canvas boards 02–07). Add each to `app/sitemap.ts` when it exists, and `hasMenu` in `lib/schema.ts` once `/menu` is live.

## Accessibility & performance notes

- WCAG AA contrast (muted text #a1a1a1 on #0a0a0a = 7.9:1), visible amber focus ring, skip link,
  real buttons/labels, `aria-expanded` accordion, mobile sheet closes on Esc.
- `prefers-reduced-motion` disables all loops and reveals.
- Hero headline animates with pure CSS → visible without JS, good LCP. Images via `next/image` (AVIF/WebP).
- Fonts are self-hosted via the `geist` package (no Google Fonts request).
