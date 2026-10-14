import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MenuTabs } from "./menu-tabs";
import { getDictionary } from "@/content/dictionaries";
import { MENU } from "@/content/menu";
import { IMAGES } from "@/content/shared";
import { hasLocale, href } from "@/lib/i18n";
import { jsonLdString } from "@/lib/schema";
import { alternates } from "@/lib/seo";
import { site } from "@/lib/site";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang).menu;
  return { title: t.metaTitle, description: t.metaDescription, alternates: alternates(lang, "/menu") };
}

export default async function MenuPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang).menu;

  // schema.org Menu — prices only where known (no "[—]" placeholders sent to Google).
  const menuSchema = {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": `${site.url}/${lang}/menu#menu`,
    name: `${site.name} — ${t.metaTitle}`,
    inLanguage: lang,
    hasMenuSection: MENU.map((s) => ({
      "@type": "MenuSection",
      name: s.label[lang],
      hasMenuItem:
        s.kind === "list"
          ? s.items.map((it) => ({
              "@type": "MenuItem",
              name: it.name,
              ...(it.notes ? { description: it.notes[lang] } : {}),
              ...(it.price != null ? { offers: { "@type": "Offer", price: it.price, priceCurrency: site.currency } } : {}),
            }))
          : s.groups.flatMap((g) =>
              g.rows.map((r) => ({
                "@type": "MenuItem",
                name: `${r.name} (${r.size})`,
                offers: { "@type": "Offer", price: r.bottle, priceCurrency: site.currency },
              })),
            ),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(menuSchema) }} />
      <section aria-labelledby="menu-h" className="relative overflow-hidden px-5 pb-16 pt-24 md:px-[clamp(20px,5vw,80px)]">
        <div aria-hidden className="absolute -right-48 -top-48 size-[700px] rounded-full bg-amber opacity-10 blur-[140px]" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-7">
          <span className="label-mono">{t.kicker}</span>
          <h1 id="menu-h" className="display text-[clamp(72px,14vw,220px)] leading-[0.8] tracking-[-0.065em]">{t.title1}<br /><span className="text-[#2e2e2e]">{t.title2}</span></h1>
          <p className="max-w-[520px] text-lg leading-relaxed text-mist">{t.lead}</p>
          <p className="flex max-w-[520px] items-start gap-3 rounded-tile border border-white/10 bg-surface-1 px-5 py-4 text-sm leading-relaxed text-mist">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffaa40" strokeWidth="1.75" strokeLinecap="round" aria-hidden className="mt-0.5 size-5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
            {t.note}
          </p>
          <p className="flex max-w-[520px] items-center gap-3 self-start rounded-full border border-amber/40 bg-amber/10 px-5 py-3 text-sm font-medium text-amber">
            <span aria-hidden className="size-2 rounded-full bg-amber shadow-[0_0_12px_#ffaa40]" />
            {t.deal}
          </p>
        </div>
      </section>

      <MenuTabs t={t} lang={lang} />

      <section aria-labelledby="share-h" className="px-3 pb-8 md:px-[clamp(12px,2vw,32px)]">
        <div className="mx-auto grid max-w-[1376px] overflow-hidden rounded-panel border border-white/10 md:grid-cols-2">
          <div className="flex flex-col justify-center gap-6 bg-[#0f0f0f] p-[clamp(32px,6vw,88px)]">
            <span className="label-mono">{t.shareKicker}</span>
            <h2 id="share-h" className="display text-[clamp(40px,5vw,72px)] leading-[0.95] tracking-[-0.045em]">{t.shareTitle1}<br />{t.shareTitle2}</h2>
            <p className="max-w-md text-[17px] leading-relaxed text-mist">{t.shareLead}</p>
            <Link href={href(lang, "/reserve")} className="inline-flex h-13 items-center self-start rounded-full bg-moon px-6 font-semibold text-night">{t.shareCta}</Link>
          </div>
          <div className="relative min-h-[420px]"><Image src={IMAGES.melon} alt={t.shareAlt} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" /></div>
        </div>
      </section>
    </>
  );
}
