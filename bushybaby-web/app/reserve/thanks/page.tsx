import type { Metadata } from "next";
import Link from "next/link";
import { AuroraText } from "@/components/magicui";
import { Icon } from "@/components/site/logo";
import { site } from "@/lib/site";
import { formatDay, whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Request sent", robots: { index: false } };

type Search = Promise<{ d?: string; t?: string; g?: string; n?: string }>;

export default async function ThanksPage({ searchParams }: { searchParams: Search }) {
  const { d, t, g, n } = await searchParams;
  const day = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? formatDay(d) : "—";
  const rows = [["Date", day], ["Time", t ?? "—"], ["Guests", g ?? "—"], ["Name", n?.slice(0, 40) || "—"]];
  const cal = d && t ? calendarUrl(d, t) : null;

  return (
    <section className="relative flex min-h-[80svh] items-center overflow-hidden px-5 py-24 md:px-[clamp(20px,5vw,80px)]">
      <div aria-hidden className="absolute -right-40 -top-40 size-[640px] rounded-full bg-violet opacity-[0.14] blur-[140px]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-wrap items-center gap-[clamp(40px,6vw,96px)]">
        <div className="flex flex-[1_1_420px] flex-col gap-7">
          <span className="label-mono inline-flex h-8 items-center gap-2 self-start rounded-full border border-live/35 px-3.5 text-live"><Icon.Check className="size-3.5" />Sent to WhatsApp</span>
          <h1 className="display text-[clamp(56px,7vw,108px)]">Your stool<br />is <AuroraText>almost saved.</AuroraText></h1>
          <p className="max-w-md text-lg leading-relaxed text-mist">Hit send in WhatsApp if you haven&apos;t yet. We confirm right there — usually within minutes during opening hours.</p>
          <div className="flex flex-wrap gap-3">
            {cal && <a href={cal} target="_blank" rel="noopener" className="inline-flex h-13 items-center rounded-full bg-moon px-6 font-semibold text-night">Add to calendar</a>}
            <a href={whatsappUrl(site.whatsapp)} className="inline-flex h-13 items-center gap-2 rounded-full border border-white/20 px-6"><Icon.WhatsApp /> Open WhatsApp again</a>
            <Link href="/" className="inline-flex h-13 items-center px-3 text-mist hover:text-moon">Back home →</Link>
          </div>
        </div>
        <div className="flex-[1_1_360px] max-w-md overflow-hidden rounded-card bg-moon text-night shadow-[0_60px_120px_-30px_rgba(0,0,0,0.9)]">
          <div className="flex flex-col gap-7 p-8">
            <span className="text-lg font-bold tracking-[-0.03em]">bushybaby</span>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
              {rows.map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1"><dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-600">{k}</dt><dd className="text-[22px] font-semibold tracking-[-0.02em]">{v}</dd></div>
              ))}
            </dl>
          </div>
          <div aria-hidden className="mx-6 border-t-2 border-dashed border-neutral-300" />
          <p className="p-8 pt-6 text-sm text-neutral-700">Status: <strong className="text-amber-700">awaiting confirmation</strong></p>
        </div>
      </div>
    </section>
  );
}

/** Google Calendar template link, 2-hour slot, local time (no timezone conversion needed). */
function calendarUrl(date: string, time: string) {
  const [h, m] = time.split(":").map(Number);
  const start = `${date.replace(/-/g, "")}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
  const endH = (h + 2) % 24;
  const endDate = h + 2 >= 24 ? nextDay(date) : date;
  const end = `${endDate.replace(/-/g, "")}T${String(endH).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
  const p = new URLSearchParams({ action: "TEMPLATE", text: `Table at ${site.name}`, dates: `${start}/${end}`, ctz: "Africa/Nairobi" });
  return `https://calendar.google.com/calendar/render?${p}`;
}

function nextDay(iso: string) {
  const [y, mo, d] = iso.split("-").map(Number);
  const n = new Date(Date.UTC(y, mo - 1, d + 1));
  return n.toISOString().slice(0, 10);
}
