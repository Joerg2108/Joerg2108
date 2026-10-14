import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReserveForm } from "./reserve-form";
import { getDictionary } from "@/content/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { alternates } from "@/lib/seo";
import { site } from "@/lib/site";
import { whatsappUrl } from "@/lib/whatsapp";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang).reserve;
  return { title: t.metaTitle, description: t.metaDescription, alternates: alternates(lang, "/reserve") };
}

const DAY_LABEL = {
  en: { Mo: "Mon", Tu: "Tue", We: "Wed", Th: "Thu", Fr: "Fri", Sa: "Sat", Su: "Sun" },
  de: { Mo: "Mo", Tu: "Di", We: "Mi", Th: "Do", Fr: "Fr", Sa: "Sa", Su: "So" },
} as const;

export default async function ReservePage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.reserve;
  const a = site.address;
  const days = DAY_LABEL[lang];
  const hours = site.openingHours.length
    ? site.openingHours.map((s) => `${days[s.days[0]]}${s.days.length > 1 ? ` — ${days[s.days[s.days.length - 1]]}` : ""} · ${s.opens} — ${s.closes}`)
    : t.hoursFallback;
  const mapsHref = site.geo
    ? `https://www.google.com/maps/search/?api=1&query=${site.geo.lat},${site.geo.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([site.name, a.street, a.town].filter(Boolean).join(", "))}`;

  return (
    <section className="relative px-5 pb-28 pt-24 md:px-[clamp(20px,5vw,80px)]">
      <div aria-hidden className="absolute -left-48 top-0 size-[700px] rounded-full bg-amber opacity-[0.08] blur-[150px]" />
      <div className="relative mx-auto flex max-w-7xl flex-wrap items-start gap-[clamp(40px,6vw,96px)]">
        <div className="flex flex-[1_1_380px] flex-col gap-10">
          <div className="flex flex-col gap-6">
            <span className="label-mono">{t.kicker}</span>
            <h1 className="display text-[clamp(56px,7vw,112px)]">{t.title1}<br />{t.title2}</h1>
            <p className="max-w-md text-lg leading-relaxed text-mist">{t.lead}</p>
          </div>
          <dl id="find-us" className="scroll-mt-28 border-t border-white/10">
            <Row k={t.rows.hours}>{hours.map((h) => <span key={h} className="block">{h}</span>)}</Row>
            <Row k={t.rows.address}>
              <span className="block">{a.street ?? t.streetFallback}</span>
              <span className="block">{a.town ?? t.townFallback}, {dict.common.country}</span>
              <a href={mapsHref} className="mt-2 inline-block text-amber underline-offset-4 hover:underline" rel="noopener">{t.openMaps}</a>
            </Row>
            <Row k={t.rows.contact}>
              <a href={whatsappUrl(site.whatsapp)} className="block hover:text-amber">{site.phoneDisplay ?? t.phoneFallback}</a>
              <a href={site.instagram} className="block hover:text-amber" rel="noopener">@bushybaby_tikipub</a>
            </Row>
          </dl>
        </div>
        <div className="min-w-0 flex-[999_1_560px]">
          <ReserveForm lang={lang} t={{ form: t.form, errors: t.errors }} />
        </div>
      </div>
    </section>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 border-b border-white/10 py-5">
      <dt className="label-mono pt-1">{k}</dt>
      <dd className="leading-relaxed">{children}</dd>
    </div>
  );
}
