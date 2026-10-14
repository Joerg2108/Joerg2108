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

export type ValidationErrors = Partial<Record<keyof ReservationRequest, string>>;

export function validateReservation(r: ReservationRequest, maxGuests = 20): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) errors.date = "Pick a day.";
  if (!/^\d{2}:\d{2}$/.test(r.time)) errors.time = "Pick a time.";
  if (!Number.isInteger(r.guests) || r.guests < 1) errors.guests = "At least one guest.";
  else if (r.guests > maxGuests) errors.guests = `For more than ${maxGuests} guests, ask us about a private night.`;
  if (r.name.trim().length < 2) errors.name = "Tell us your name.";
  if (r.note && r.note.length > 500) errors.note = "Keep the note under 500 characters.";
  return errors;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2026-10-16" → "Fri 16 Oct". Built by hand on purpose: Intl output differs
 * between engines (Chrome adds a comma, Node doesn't), which broke the day chips
 * and would cause server/client text mismatches.
 */
export function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAYS[date.getUTCDay()]} ${d} ${MONTHS[m - 1]}`;
}

export function buildReservationMessage(r: ReservationRequest): string {
  const lines = [
    "Hi BushyBaby! I'd like to reserve a table.",
    "",
    `Day: ${formatDay(r.date)}`,
    `Time: ${r.time}`,
    `Guests: ${r.guests}`,
    `Name: ${r.name.trim()}`,
  ];
  if (r.phone?.trim()) lines.push(`Phone: ${r.phone.trim()}`);
  if (r.note?.trim()) lines.push(`Note: ${r.note.trim()}`);
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
