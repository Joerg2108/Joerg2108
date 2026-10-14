/**
 * WhatsApp click-to-chat reservations.
 * No backend: the form builds a pre-filled message and opens wa.me.
 * The host answers from the WhatsApp (Business) app — confirmation in one tap.
 */

export interface ReservationRequest {
  date: string; // ISO "2026-10-16"
  time: string; // "20:00"
  guests: number;
  name: string;
  phone?: string;
  note?: string;
}

/** Error *codes* — the UI translates them via the dictionary (dict.reserve.errors). */
export type ValidationCode = "date" | "time" | "guestsMin" | "guestsMax" | "name" | "noteLength";
export type ValidationErrors = Partial<Record<keyof ReservationRequest, ValidationCode>>;

export function validateReservation(r: ReservationRequest, maxGuests = 20): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) errors.date = "date";
  if (!/^\d{2}:\d{2}$/.test(r.time)) errors.time = "time";
  if (!Number.isInteger(r.guests) || r.guests < 1) errors.guests = "guestsMin";
  else if (r.guests > maxGuests) errors.guests = "guestsMax";
  if (r.name.trim().length < 2) errors.name = "name";
  if (r.note && r.note.length > 500) errors.note = "noteLength";
  return errors;
}

const NAMES = {
  en: { days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] },
  de: { days: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"], months: ["Jan", "Feb", "März", "Apr", "Mai", "Juni", "Juli", "Aug", "Sep", "Okt", "Nov", "Dez"] },
} as const;

/**
 * "2026-10-16" → "Fri 16 Oct" (en) / "Fr 16. Okt" (de). Built by hand on purpose:
 * Intl output differs between engines (Chrome adds a comma, Node doesn't), which
 * would break the day chips and cause server/client text mismatches.
 */
export function formatDay(iso: string, lang: "en" | "de" = "en"): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const n = NAMES[lang];
  return lang === "de" ? `${n.days[date.getUTCDay()]} ${d}. ${n.months[m - 1]}` : `${n.days[date.getUTCDay()]} ${d} ${n.months[m - 1]}`;
}

const LANGUAGE_NAME = { en: "English", de: "German" } as const;

/**
 * The message goes to the bar crew, so it's always in English (the host's language).
 * For non-English guests a "Guest language" line tells the crew how to reply.
 */
export function buildReservationMessage(r: ReservationRequest, guestLang: "en" | "de" = "en"): string {
  const lines = [
    "Hi BushyBaby! I'd like to reserve a table.",
    "",
    `Day: ${formatDay(r.date, "en")}`,
    `Time: ${r.time}`,
    `Guests: ${r.guests}`,
    `Name: ${r.name.trim()}`,
  ];
  if (r.phone?.trim()) lines.push(`Phone: ${r.phone.trim()}`);
  if (r.note?.trim()) lines.push(`Note: ${r.note.trim()}`);
  if (guestLang !== "en") lines.push(`Guest language: ${LANGUAGE_NAME[guestLang]}`);
  return lines.join("\n");
}

/** Strips everything but digits; wa.me needs the international number without "+" or leading zeros. */
export function normalizeWhatsAppNumber(input: string): string {
  return input.replace(/\D/g, "").replace(/^00/, "");
}

export function whatsappUrl(number: string | null, text?: string): string {
  const base = number ? `https://wa.me/${normalizeWhatsAppNumber(number)}` : "https://wa.me/";
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
