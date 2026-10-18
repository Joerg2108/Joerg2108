import Link from "next/link";
import { Wordmark } from "./logo";
import type { Dictionary } from "@/content/dictionaries";
import { href, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { whatsappUrl } from "@/lib/whatsapp";

export function Footer({ lang, t, country }: { lang: Locale; t: Dictionary["footer"]; country: string }) {
  const a = site.address;
  const where = [a.street, a.town].filter(Boolean).join(", ") || country;
  return (
    <footer className="overflow-hidden border-t border-white/5 px-5 pt-20 md:px-[clamp(20px,5vw,80px)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 text-sm md:grid-cols-5">
        <div className="col-span-2 flex max-w-xs flex-col gap-3.5">
          <Wordmark size={48} className="text-lg" />
          <span className="leading-relaxed text-mist">{t.about} {where}.</span>
        </div>
        <FooterCol lang={lang} title={t.explore} links={t.exploreLinks} />
        <FooterCol lang={lang} title={t.visit} links={[["/reserve", t.reserve], ["/reserve#find-us", t.directions], [site.instagram, "Instagram"], [whatsappUrl(site.whatsapp), "WhatsApp"]]} />
        <FooterCol lang={lang} title={t.legal} links={[["/legal/imprint", t.imprint], ["/legal/privacy", t.privacy], ["/faq", t.faq]]} />
      </div>
      <p className="mx-auto mt-10 max-w-7xl text-xs text-dim">{t.responsible}</p>
      <div
        aria-hidden
        className="mx-auto mt-16 max-w-7xl select-none bg-gradient-to-b from-[#2a2a2a] to-night to-[92%] bg-clip-text text-center text-[clamp(48px,19vw,300px)] font-bold leading-[0.78] tracking-[-0.07em] text-transparent"
      >
        bushybaby
      </div>
    </footer>
  );
}

function FooterCol({ lang, title, links }: { lang: Locale; title: string; links: [string, string][] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-3">
      <span className="label-mono text-[11px]">{title}</span>
      {links.map(([to, label]) =>
        to.startsWith("http") ? (
          <a key={label} href={to} className="text-neutral-300 hover:text-amber" rel="noopener">{label}</a>
        ) : (
          <Link key={label} href={href(lang, to)} className="text-neutral-300 hover:text-amber">{label}</Link>
        ),
      )}
    </nav>
  );
}
