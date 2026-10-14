/**
 * Single source of truth for all business data.
 * Everything marked `null` is still unknown — fill it in before going live.
 * Unknown values are left OUT of the structured data (lib/schema.ts) instead of
 * shipping placeholders to Google.
 */

export type DayCode = "Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa" | "Su";

export interface OpeningSlot {
  days: DayCode[];
  opens: string; // "17:00"
  closes: string; // "02:00" — after midnight is fine
}

export const site = {
  name: "BushyBaby Tiki Pub",
  shortName: "bushybaby",
  tagline: "Wide awake after dark.",
  description:
    "Hand-built tiki pub under a thatched makuti roof in Kenya. Fresh-fruit cocktails, rum and long, fire-lit nights. Reserve a table on WhatsApp.",
  /** Production URL without trailing slash — set via env on the host. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en_KE",

  /** WhatsApp number in international format, digits only, e.g. "254712345678". */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
  /** Displayed phone number, e.g. "+254 712 345 678". */
  phoneDisplay: null as string | null,
  email: null as string | null,
  instagram: "https://www.instagram.com/bushybaby_tikipub",

  address: {
    street: null as string | null,
    town: null as string | null, // e.g. "Diani Beach"
    region: null as string | null, // e.g. "Kwale County"
    postalCode: null as string | null,
    country: "KE",
  },
  /** Exact coordinates help Google Maps a lot — copy from Google Maps → right-click → coordinates. */
  geo: null as { lat: number; lng: number } | null,

  /** Leave empty until confirmed. Example: [{ days: ["Mo","Tu","We","Th"], opens: "17:00", closes: "00:00" }] */
  openingHours: [] as OpeningSlot[],

  priceRange: null as string | null, // e.g. "KES 500–1500"
  currency: "KES",
  paymentAccepted: null as string | null, // e.g. "Cash, Credit Card, M-Pesa"
  foundingYear: null as number | null,

  reservation: {
    /** Earliest / latest bookable time slot on the reserve form. */
    slots: ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"],
    maxGuests: 20,
    daysAhead: 14,
  },
} as const;

export type Site = typeof site;
