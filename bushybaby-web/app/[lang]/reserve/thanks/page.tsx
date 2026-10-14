import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuroraText } from "@/components/magicui";
import { Icon } from "@/components/site/logo";
import { getDictionary } from "@/content/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { site } from "@/lib/site";
import { formatDay, whatsappUrl } from "@/lib/whatsapp";

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ d?: string; t?: string; g?: string; n?: string }> };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: getDictionary(lang).thanks.metaTitle, robots: { index: false } };
}

export default async function ThanksPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang).thanks;
  const { d, t: time, g, n } = await searchParams;
  const validDate = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  const validTime = time && /^\d{2}:\d{2}$/.test(time) ? time : null;
  const rows = [[t.rows.date, validDate ? formatDay(validDate, lang) : "—"], [t.rows.time, validTime ?? "—"], [t.rows.guests, g?.slice(0, 3) ?? "—"], [t.rows.name, n?.slice(0, 40) || "—"]];
  const cal = validDate && validTime ? calendarUrl(validDate, validTime, t.calendarTitle) : null;

  return (
    <section className="relative flex min-h-[80svh] items-center overflow-hidden px-5 py-24 md:px-[clamp(20px,5vw,80px)]">
      <div aria-hidden className="absolute -right-40 -top-40 size-[640px] rounded-full bg-violet opacity-[0.14] blur-[140px]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-wrap items-center gap-[clamp(40px,6vw,96px)]">
        <div className="flex flex-[1_1_420px] flex-col gap-7">
          <span className="label-mono inline-flex h-8 items-center gap-2 self-start rounded-full border border-live/35 px-3.5 text-live"><Icon.Check className="size-3.5" />{t.badge}</span>
          <h1 className="display text-[clamp(56px,7vw,108px)]">{t.title1}<br />{t.title2} <AuroraText>{t.title3}</AuroraText></h1>
          <p className="max-w-md text-lg leading-relaxed text-mist">{t.lead}</p>
          <div className="flex flex-wrap gap-3">
            {cal && <a href={cal} target="_blank" rel="noopener" className="inline-flex h-13 items-center rounded-full bg-moon px-6 font-semibold text-night">{t.calendar}</a>}
            <a href={whatsappUrl(site.whatsapp)} className="inline-flex h-13 items-center gap-2 rounded-full border border-white/20 px-6"><Icon.WhatsApp /> {t.whatsappAgain}</a>
            <Link href={href(lang, "/")} className="inline-flex h-13 items-center px-3 text-mist hover:text-moon">{t.home}</Link>
          </div>
        </div>
        <div className="max-w-md flex-[1_1_360px] overflow-hidden rounded-card bg-moon text-night shadow-[0_60px_120px_-30px_rgba(0,0,0,0.9)]">
          <div className="flex flex-col gap-7 p-8">
            <span className="text-lg font-bold tracking-[-0.03em]">bushybaby</span>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
              {rows.map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1"><dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-600">{k}</dt><dd className="text-[22px] font-semibold tracking-[-0.02em]">{v}</dd></div>
              ))}
            </dl>
          </div>
          <div aria-hidden className="mx-6 border-t-2 border-dashed border-neutral-300" />
          <p className="p-8 pt-6 text-sm text-neutral-700">{t.status} <strong className="text-amber-700">{t.pending}</strong></p>
        </div>
      </div>
    </section>
  );
}

/** Google Calendar template link, 2-hour slot, Nairobi time. */
function calendarUrl(date: string, time: string, title: string) {
  const [h, m] = time.split(":").map(Number);
  const pad = (x: number) => String(x).padStart(2, "0");
  const start = `${date.replace(/-/g, "")}T${pad(h)}${pad(m)}00`;
  const endDate = h + 2 >= 24 ? nextDay(date) : date;
  const end = `${endDate.replace(/-/g, "")}T${pad((h + 2) % 24)}${pad(m)}00`;
  const p = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${start}/${end}`, ctz: "Africa/Nairobi" });
  return `https://calendar.google.com/calendar/render?${p}`;
}

function nextDay(iso: string) {
  const [y, mo, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d + 1)).toISOString().slice(0, 10);
}
