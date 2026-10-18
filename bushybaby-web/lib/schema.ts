import type { Site, OpeningSlot } from "./site";

/**
 * schema.org JSON-LD for the pub (type BarOrPub).
 * Rule: unknown values are omitted, never faked — Google penalises wrong data
 * more than missing data.
 */

const DAY: Record<OpeningSlot["days"][number], string> = {
  Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday", Sa: "Saturday", Su: "Sunday",
};

type Json = string | number | boolean | null | Json[] | { [k: string]: Json | undefined };

/** Recursively drops null / undefined / empty strings, arrays and objects. */
export function prune<T extends Json | undefined>(value: T): T | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (Array.isArray(value)) {
    const arr = value.map((v) => prune(v)).filter((v) => v !== undefined);
    return (arr.length ? arr : undefined) as T | undefined;
  }
  if (typeof value === "object") {
    const out: Record<string, Json> = {};
    for (const [k, v] of Object.entries(value)) {
      const p = prune(v as Json);
      if (p !== undefined) out[k] = p;
    }
    // An object holding only its @type is empty.
    const keys = Object.keys(out).filter((k) => k !== "@type");
    return (keys.length ? out : undefined) as T | undefined;
  }
  return value;
}

/**
 * One schema per language page. `@id` stays the same in every language, so
 * Google treats /en and /de as the same pub, just described in two languages.
 */
export function buildBarSchema(site: Site, opts: { lang: string; description: string } = { lang: "en", description: site.description }) {
  const url = site.url.replace(/\/$/, "");
  const page = `${url}/${opts.lang}`;
  const a = site.address;
  const hasAddress = Boolean(a.street || a.town);

  const schema: Json = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    "@id": `${url}/#pub`,
    name: site.name,
    description: opts.description,
    url: page,
    image: [
      `${url}/images/bar-night.jpg`,
      `${url}/images/bar-sign.jpg`,
      `${url}/images/whole-melon.jpg`,
    ],
    logo: `${url}/brand/logo-512.jpg`,
    telephone: site.phoneDisplay,
    email: site.email,
    priceRange: site.priceRange,
    currenciesAccepted: site.currency,
    paymentAccepted: site.paymentAccepted,
    hasMap: site.mapsUrl,
    foundingDate: site.foundingYear ? String(site.foundingYear) : null,
    servesCuisine: ["Cocktails", "Tiki drinks"],
    acceptsReservations: true,
    hasMenu: `${page}/menu`,
    sameAs: [site.instagram],
    address: hasAddress
      ? {
          "@type": "PostalAddress",
          streetAddress: a.street,
          addressLocality: a.town,
          addressRegion: a.region,
          postalCode: a.postalCode,
          addressCountry: a.country,
        }
      : null,
    geo: site.geo ? { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng } : null,
    openingHoursSpecification: site.openingHours.map((s) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: s.days.map((d) => `https://schema.org/${DAY[d]}`),
      opens: s.opens,
      closes: s.closes,
    })),
    potentialAction: {
      "@type": "ReserveAction",
      target: { "@type": "EntryPoint", urlTemplate: `${page}/reserve`, actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"] },
      result: { "@type": "FoodEstablishmentReservation", name: "Table reservation" },
    },
  };

  return prune(schema);
}

/** Safe for <script type="application/ld+json">: escapes "<" so content can't close the tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
