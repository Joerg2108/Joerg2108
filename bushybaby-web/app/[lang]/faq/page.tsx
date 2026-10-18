import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Faq } from "@/components/home/faq";
import { Icon } from "@/components/site/logo";
import { getDictionary } from "@/content/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { jsonLdString } from "@/lib/schema";
import { alternates } from "@/lib/seo";
import { site } from "@/lib/site";
import { whatsappUrl } from "@/lib/whatsapp";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang).faqPage;
  return { title: t.metaTitle, description: t.metaDescription, alternates: alternates(lang, "/faq") };
}

export default async function FaqPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const t = d.faqPage;
  const items = [...d.home.faq.items, ...t.extra];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang,
    mainEntity: items.filter((f) => !f.a.includes("[")).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <section className="px-5 pb-32 pt-24 md:px-[clamp(20px,5vw,80px)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqSchema) }} />
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-6 lg:sticky lg:top-32 lg:self-start">
          <span className="label-mono">{t.kicker}</span>
          <h1 className="display text-[clamp(52px,6vw,96px)] leading-[0.9] tracking-[-0.055em]">{t.title1}<br /><span className="text-dim">{t.title2}</span></h1>
          <p className="max-w-sm text-lg leading-relaxed text-mist">{t.lead}</p>
          <a href={whatsappUrl(site.whatsapp, d.common.whatsappHello)} className="inline-flex h-13 items-center gap-2.5 self-start rounded-full bg-moon px-6 font-semibold text-night"><Icon.WhatsApp /> {t.ask}</a>
        </div>
        <Faq items={items} level={2} />
      </div>
    </section>
  );
}
