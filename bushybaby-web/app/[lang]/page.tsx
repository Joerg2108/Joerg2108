import { notFound } from "next/navigation";
import { FaqSection, FinalCta, FourActs, Hero, IngredientMarquee, Reviews, Signatures, TheSpace, WaysToStay, WeekSection } from "@/components/home/sections";
import { getDictionary } from "@/content/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { jsonLdString } from "@/lib/schema";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);

  // FAQPage rich result — only answers that are visible on the page and have no [placeholders].
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang,
    mainEntity: t.home.faq.items
      .filter((f) => !f.a.includes("["))
      .map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqSchema) }} />
      <Hero lang={lang} t={t} />
      <IngredientMarquee t={t} />
      <Signatures lang={lang} t={t} />
      <FourActs t={t} />
      <WeekSection t={t} />
      <TheSpace t={t} />
      <WaysToStay lang={lang} t={t} />
      <Reviews t={t} />
      <FaqSection t={t} />
      <FinalCta lang={lang} t={t} />
    </>
  );
}
