import { FaqSection, FinalCta, FourActs, Hero, IngredientMarquee, Reviews, Signatures, TheSpace, WaysToStay } from "@/components/home/sections";
import { faqs } from "@/content/home";
import { jsonLdString } from "@/lib/schema";

// FAQPage rich result — only visible-on-page Q&As, no placeholders in [brackets].
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs
    .filter((f) => !f.a.includes("["))
    .map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqSchema) }} />
      <Hero />
      <IngredientMarquee />
      <Signatures />
      <FourActs />
      <TheSpace />
      <WaysToStay />
      <Reviews />
      <FaqSection />
      <FinalCta />
    </>
  );
}
