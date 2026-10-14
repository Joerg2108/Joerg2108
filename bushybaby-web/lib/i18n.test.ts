import { test } from "node:test";
import assert from "node:assert/strict";
import { href, localeFromPath, negotiateLocale, switchLocalePath } from "./i18n.ts";

test("negotiates the browser language", () => {
  assert.equal(negotiateLocale("de-DE,de;q=0.9,en;q=0.8"), "de");
  assert.equal(negotiateLocale("de-AT"), "de");
  assert.equal(negotiateLocale("en-US,en;q=0.9"), "en");
  assert.equal(negotiateLocale("fr-FR,fr;q=0.9,de;q=0.7,en;q=0.5"), "de"); // first supported by quality
  assert.equal(negotiateLocale("fr-FR,en;q=0.4,de;q=0.6"), "de"); // q-values beat order
  assert.equal(negotiateLocale("sw-KE"), "en"); // unsupported → default
  assert.equal(negotiateLocale(""), "en");
  assert.equal(negotiateLocale(null), "en");
  assert.equal(negotiateLocale("de;q=0"), "en"); // q=0 means "not acceptable"
});

test("switches the locale prefix and keeps the rest of the path", () => {
  assert.equal(switchLocalePath("/en", "de"), "/de");
  assert.equal(switchLocalePath("/en/reserve", "de"), "/de/reserve");
  assert.equal(switchLocalePath("/de/reserve/thanks", "en"), "/en/reserve/thanks");
  assert.equal(switchLocalePath("/", "de"), "/de");
  assert.equal(switchLocalePath("/menu", "de"), "/de/menu");
  assert.equal(switchLocalePath("/english-breakfast", "de"), "/de/english-breakfast"); // not fooled by "en" prefix
});

test("reads the locale from a path", () => {
  assert.equal(localeFromPath("/de/reserve"), "de");
  assert.equal(localeFromPath("/denver"), null);
  assert.equal(localeFromPath("/"), null);
});

test("builds localized links", () => {
  assert.equal(href("de", "/"), "/de");
  assert.equal(href("de", "/reserve#find-us"), "/de/reserve#find-us");
  assert.equal(href("en", "https://wa.me/1"), "https://wa.me/1");
});
