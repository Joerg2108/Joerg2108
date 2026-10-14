import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReservationMessage, formatDay, normalizeWhatsAppNumber, validateReservation, whatsappUrl } from "./whatsapp.ts";

const ok = { date: "2026-10-16", time: "20:00", guests: 4, name: "Jörg", note: "Birthday & melon" };

test("formatDay is timezone-safe and engine-independent", () => {
  assert.equal(formatDay("2026-10-16"), "Fri 16 Oct");
  assert.equal(formatDay("2026-01-04"), "Sun 4 Jan");
  assert.equal(formatDay("2028-02-29"), "Tue 29 Feb");
});

test("formatDay in German", () => {
  assert.equal(formatDay("2026-10-16", "de"), "Fr 16. Okt");
  assert.equal(formatDay("2026-03-01", "de"), "So 1. März");
});

test("message contains all filled fields, skips empty ones", () => {
  const msg = buildReservationMessage(ok);
  assert.match(msg, /Day: Fri 16 Oct/);
  assert.match(msg, /Guests: 4/);
  assert.match(msg, /Note: Birthday & melon/);
  assert.doesNotMatch(msg, /Phone:/);
  assert.doesNotMatch(msg, /Guest language/);
});

test("German guests: message stays English for the crew, flags the language", () => {
  const msg = buildReservationMessage(ok, "de");
  assert.match(msg, /Day: Fri 16 Oct/);
  assert.match(msg, /Guest language: German/);
});

test("url encodes newlines, umlauts and ampersands", () => {
  const url = whatsappUrl("+254 712 345 678", buildReservationMessage(ok));
  assert.ok(url.startsWith("https://wa.me/254712345678?text="));
  assert.ok(!url.includes("\n") && !url.includes(" ") && !url.includes("&m"));
  assert.equal(decodeURIComponent(url.split("?text=")[1]), buildReservationMessage(ok));
});

test("normalizes 00-prefixed numbers", () => {
  assert.equal(normalizeWhatsAppNumber("00254 712-345-678"), "254712345678");
});

test("validation returns codes", () => {
  assert.deepEqual(validateReservation(ok), {});
  assert.deepEqual(validateReservation({ date: "", time: "", guests: 0, name: " " }), { date: "date", time: "time", guests: "guestsMin", name: "name" });
  assert.equal(validateReservation({ ...ok, guests: 30 }).guests, "guestsMax");
});
