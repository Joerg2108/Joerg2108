import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBarSchema, jsonLdString, prune } from "./schema.ts";
import { site } from "./site.ts";

test("unknown values are omitted, not faked", () => {
  const s = buildBarSchema(site) as Record<string, unknown>;
  assert.equal(s["@type"], "BarOrPub");
  assert.equal(s.address, undefined);
  assert.equal(s.geo, undefined);
  assert.equal(s.openingHoursSpecification, undefined);
  assert.equal(s.telephone, "+254 740 022547"); // known value is included
  assert.deepEqual(s.sameAs, [site.instagram]);
});

test("filled data appears in full", () => {
  const filled = {
    ...site,
    url: "https://bushybaby.example",
    address: { ...site.address, town: "Diani Beach" },
    geo: { lat: -4.3, lng: 39.58 },
    openingHours: [{ days: ["Fr", "Sa"] as const, opens: "17:00", closes: "02:00" }],
  } as unknown as typeof site;
  const s = buildBarSchema(filled) as any;
  assert.equal(s.address.addressLocality, "Diani Beach");
  assert.equal(s.address.addressCountry, "KE");
  assert.equal(s.geo.latitude, -4.3);
  assert.deepEqual(s.openingHoursSpecification[0].dayOfWeek, ["https://schema.org/Friday", "https://schema.org/Saturday"]);
  assert.equal(s.potentialAction.target.urlTemplate, "https://bushybaby.example/en/reserve");
});

test("prune drops objects that only carry @type", () => {
  assert.equal(prune({ "@type": "PostalAddress", streetAddress: null }), undefined);
});

test("json-ld string cannot break out of the script tag", () => {
  assert.ok(!jsonLdString({ x: "</script><script>alert(1)</script>" }).includes("</script>"));
});

test("per-language schema shares one @id", () => {
  const en = buildBarSchema(site, { lang: "en", description: "Tiki pub" }) as any;
  const de = buildBarSchema(site, { lang: "de", description: "Tiki-Bar" }) as any;
  assert.equal(en["@id"], de["@id"]);
  assert.equal(de.description, "Tiki-Bar");
  assert.ok(de.url.endsWith("/de"));
  assert.ok(de.potentialAction.target.urlTemplate.endsWith("/de/reserve"));
  assert.ok(de.hasMenu.endsWith("/de/menu"), "menu link follows the page language");
});
