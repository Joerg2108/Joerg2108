import type { Metadata } from "next";
import { ReserveForm } from "./reserve-form";
import { site } from "@/lib/site";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Reserve a table",
  description: `Reserve a table at ${site.name} in 30 seconds — confirmed on WhatsApp.`,
  alternates: { canonical: "/reserve" },
};

const DAY_LABEL = { Mo: "Mon", Tu: "Tue", We: "Wed", Th: "Thu", Fr: "Fri", Sa: "Sat", Su: "Sun" } as const;

export default function ReservePage() {
  const a = site.address;
  const hours = site.openingHours.length
    ? site.openingHours.map((s) => `${DAY_LABEL[s.days[0]]}${s.days.length > 1 ? ` — ${DAY_LABEL[s.days[s.days.length - 1]]}` : ""} · ${s.opens} — ${s.closes}`)
    : ["[Mon — Thu · 17:00 — 00:00]", "[Fri — Sun · 17:00 — late]"];
  const mapsHref = site.geo
    ? `https://www.google.com/maps/search/?api=1&query=${site.geo.lat},${site.geo.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.name)}`;

  return (
    <section className="relative px-5 pb-28 pt-24 md:px-[clamp(20px,5vw,80px)]">
      <div aria-hidden className="absolute -left-48 top-0 size-[700px] rounded-full bg-amber opacity-[0.08] blur-[150px]" />
      <div className="relative mx-auto flex max-w-7xl flex-wrap items-start gap-[clamp(40px,6vw,96px)]">
        <div className="flex flex-[1_1_380px] flex-col gap-10">
          <div className="flex flex-col gap-6">
            <span className="label-mono">Visit &amp; reserve</span>
            <h1 className="display text-[clamp(56px,7vw,112px)]">Save us<br />a stool.</h1>
            <p className="max-w-md text-lg leading-relaxed text-mist">
              Fill in four things, tap send — WhatsApp opens with your request ready to go. We confirm right there, usually within minutes during opening hours.
            </p>
          </div>
          <dl id="find-us" className="scroll-mt-28 border-t border-white/10">
            <Row k="Hours">{hours.map((h) => <span key={h} className="block">{h}</span>)}</Row>
            <Row k="Address">
              <span className="block">{a.street ?? "[Street / landmark]"}</span>
              <span className="block">{a.town ?? "[Town]"}, Kenya</span>
              <a href={mapsHref} className="mt-2 inline-block text-amber underline-offset-4 hover:underline" rel="noopener">Open in Google Maps →</a>
            </Row>
            <Row k="Contact">
              <a href={whatsappUrl(site.whatsapp)} className="block hover:text-amber">{site.phoneDisplay ?? "[+254 — WhatsApp]"}</a>
              <a href={site.instagram} className="block hover:text-amber" rel="noopener">@bushybaby_tikipub</a>
            </Row>
          </dl>
        </div>
        <div className="min-w-0 flex-[999_1_560px]">
          <ReserveForm />
        </div>
      </div>
    </section>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 border-b border-white/10 py-5">
      <dt className="label-mono pt-1">{k}</dt>
      <dd className="leading-relaxed">{children}</dd>
    </div>
  );
}
