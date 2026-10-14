import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/reveal";
import { getDictionary } from "@/content/dictionaries";
import { IMAGES } from "@/content/shared";
import { hasLocale, href } from "@/lib/i18n";
import { alternates } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

const px = "px-5 md:px-[clamp(20px,5vw,80px)]";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang).story;
  return { title: t.metaTitle, description: t.metaDescription, alternates: alternates(lang, "/story") };
}

export default async function StoryPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang).story;

  return (
    <>
      <section aria-labelledby="story-h" className={`relative overflow-hidden pb-20 pt-24 ${px}`}>
        <div aria-hidden className="absolute -right-48 -top-48 size-[700px] rounded-full bg-amber opacity-10 blur-[140px]" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-7">
          <span className="label-mono">{t.kicker}</span>
          <h1 id="story-h" className="display text-[clamp(56px,10vw,160px)] leading-[0.85] tracking-[-0.06em]">{t.title1}<br /><span className="text-[#2e2e2e]">{t.title2}</span></h1>
          <p className="max-w-[560px] text-lg leading-relaxed text-mist">{t.lead}</p>
        </div>
      </section>

      <div className="px-3 md:px-[clamp(12px,2vw,32px)]">
        <div className="relative mx-auto h-[clamp(320px,56vw,640px)] max-w-[1376px] overflow-hidden rounded-panel border border-white/10">
          <Image src={IMAGES.barNight} alt={t.heroAlt} fill priority sizes="100vw" className="object-cover" />
        </div>
      </div>

      <section className={`py-32 ${px}`}>
        <ol className="mx-auto grid max-w-7xl gap-x-16 gap-y-20 md:grid-cols-2">
          {t.chapters.map((c, i) => (
            <Reveal as="li" key={c.no} delay={(i % 2) * 0.08} className="flex flex-col gap-5 border-t border-white/12 pt-8">
                <span className="font-mono text-[13px] text-amber">{c.no}</span>
                <h2 className="text-[clamp(32px,3.4vw,48px)] font-semibold leading-none tracking-[-0.04em]">{c.title}</h2>
                <p className="max-w-[520px] text-[17px] leading-relaxed text-mist">{c.body}</p>
              </Reveal>
          ))}
        </ol>
      </section>

      <section aria-labelledby="outro-h" className="px-3 pb-8 md:px-[clamp(12px,2vw,32px)]">
        <div className="mx-auto grid max-w-[1376px] overflow-hidden rounded-panel border border-white/10 md:grid-cols-2">
          <div className="relative min-h-[420px]"><Image src={IMAGES.barSign} alt={t.signAlt} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" /></div>
          <div className="flex flex-col justify-center gap-8 bg-[#0f0f0f] p-[clamp(28px,6vw,88px)]">
            <h2 id="outro-h" className="display text-[clamp(40px,5vw,72px)] leading-[0.95] tracking-[-0.045em]">{t.outroTitle1}<br /><span className="text-dim">{t.outroTitle2}</span></h2>
            <div className="flex flex-wrap gap-3">
              <Link href={href(lang, "/reserve")} className="inline-flex h-13 items-center rounded-full bg-moon px-6 font-semibold text-night">{t.reserve}</Link>
              <Link href={href(lang, "/menu")} className="inline-flex h-13 items-center rounded-full border border-white/15 px-6 font-medium hover:border-white/30">{t.menu}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
