import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/reveal";
import { Icon } from "@/components/site/logo";
import { getDictionary } from "@/content/dictionaries";
import { ACTS, IMAGES } from "@/content/shared";
import { hasLocale } from "@/lib/i18n";
import { alternates } from "@/lib/seo";
import { site } from "@/lib/site";
import { whatsappUrl } from "@/lib/whatsapp";

type Props = { params: Promise<{ lang: string }> };

const px = "px-5 md:px-[clamp(20px,5vw,80px)]";
const glow = ["#ffaa40", "#c45cff", "#9c40ff"];
const label = ["#ffaa40", "#d690ff", "#b98cff"]; // text-safe tints of the glows (AA contrast)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang).nights;
  return { title: t.metaTitle, description: t.metaDescription, alternates: alternates(lang, "/nights") };
}

export default async function NightsPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const t = d.nights;

  // The crew reads English — same rule as the reservation message.
  const message = ["Hi BushyBaby! I'd like to ask about a private event.", "", "Date:", "Guests:", "Occasion:", ...(lang === "de" ? ["", "Guest language: German"] : [])].join("\n");

  return (
    <>
      <section aria-labelledby="nights-h" className={`relative overflow-hidden pb-20 pt-24 ${px}`}>
        <div aria-hidden className="absolute -left-48 -top-48 size-[700px] rounded-full bg-violet opacity-[0.12] blur-[140px]" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-7">
          <span className="label-mono">{t.kicker}</span>
          <h1 id="nights-h" className="display text-[clamp(56px,10vw,160px)] leading-[0.85] tracking-[-0.06em]">{t.title1}<br /><span className="text-ghost">{t.title2}</span></h1>
          <p className="max-w-[560px] text-lg leading-relaxed text-mist">{t.lead}</p>
        </div>
      </section>

      <section aria-labelledby="week-h" className={`pb-32 ${px}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <h2 id="week-h" className="label-mono">{t.weekKicker}</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {d.home.week.items.map((e, i) => (
              <Reveal as="li" key={e.day} delay={i * 0.08} className="relative flex h-full min-h-[300px] flex-col gap-4 overflow-hidden rounded-card border border-white/10 bg-surface-1 p-8">
                  <div aria-hidden className="absolute -right-16 -top-16 size-48 rounded-full opacity-25 blur-[60px]" style={{ background: glow[i] }} />
                  <span className="label-mono relative" style={{ color: label[i] }}>{e.day}</span>
                  <h3 className="relative mt-auto text-[clamp(30px,2.8vw,40px)] font-semibold leading-[1.05] tracking-[-0.035em]">{e.title}</h3>
                  <p className="relative text-[15px] leading-relaxed text-mist">{e.body}</p>
                </Reveal>
            ))}
          </ul>
          <a href={site.instagram} rel="noopener" target="_blank" className="label-mono self-start text-amber underline-offset-4 hover:underline">{t.instagram} → @bushybaby_tikipub</a>
        </div>
      </section>

      <section aria-labelledby="day-h" className={`pb-32 ${px}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-10">
          <div className="flex flex-col gap-4">
            <span className="label-mono">{t.dayKicker}</span>
            <h2 id="day-h" className="display text-[clamp(40px,5vw,72px)] leading-[0.95] tracking-[-0.045em]">{t.dayTitle}</h2>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-card border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {d.home.acts.items.map((a, i) => (
              <li key={a.title} className="flex flex-col gap-3 bg-surface-1 p-7">
                <span className="flex items-center gap-2.5 font-mono text-[13px] text-mist"><span aria-hidden className="size-2 rounded-full" style={{ background: ACTS[i].dot }} />{ACTS[i].time}</span>
                <h3 className="text-[22px] font-semibold tracking-[-0.03em]">{a.title}</h3>
                <p className="text-[15px] leading-relaxed text-mist">{a.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="private-h" className="px-3 pb-8 md:px-[clamp(12px,2vw,32px)]">
        <div className="mx-auto grid max-w-[1376px] overflow-hidden rounded-panel border border-white/10 md:grid-cols-2">
          <div className="flex flex-col justify-center gap-7 bg-[#0f0f0f] p-[clamp(28px,6vw,88px)]">
            <span className="label-mono">{t.privateKicker}</span>
            <h2 id="private-h" className="display text-[clamp(40px,5vw,72px)] leading-[0.95] tracking-[-0.045em]">{t.privateTitle1}<br />{t.privateTitle2}</h2>
            <p className="max-w-md text-[17px] leading-relaxed text-mist">{t.privateLead}</p>
            <ul className="flex flex-wrap gap-2">
              {t.occasions.map((o) => <li key={o} className="rounded-full border border-white/12 px-3.5 py-1.5 text-sm text-neutral-300">{o}</li>)}
            </ul>
            <div className="flex flex-col gap-3 border-t border-white/10 pt-6">
              <span className="label-mono text-mist">{t.checklistTitle}</span>
              <ul className="flex flex-col gap-2.5 text-[15px] text-neutral-300">
                {t.checklist.map((c) => <li key={c} className="flex items-center gap-3"><Icon.Check className="shrink-0 text-amber" />{c}</li>)}
              </ul>
            </div>
            <a href={whatsappUrl(site.whatsapp, message)} target="_blank" rel="noopener" className="inline-flex h-14 items-center gap-2.5 self-start rounded-full bg-moon px-7 font-semibold text-night transition-transform hover:-translate-y-px"><Icon.WhatsApp /> {t.cta}</a>
          </div>
          <div className="relative min-h-[420px]"><Image src={IMAGES.barNight} alt={d.home.space.alt} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" /></div>
        </div>
      </section>
    </>
  );
}
