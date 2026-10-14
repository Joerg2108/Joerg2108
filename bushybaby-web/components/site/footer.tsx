import Link from "next/link";
import { site } from "@/lib/site";
import { whatsappUrl } from "@/lib/whatsapp";

export function Footer() {
  const a = site.address;
  const where = [a.street, a.town].filter(Boolean).join(", ") || "Kenya";
  return (
    <footer className="overflow-hidden border-t border-white/5 px-5 pt-20 md:px-[clamp(20px,5vw,80px)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 text-sm md:grid-cols-5">
        <div className="col-span-2 flex max-w-xs flex-col gap-3.5">
          <span className="text-lg font-bold tracking-[-0.03em]">bushybaby</span>
          <span className="leading-relaxed text-mist">Tiki pub under a makuti roof. {where}.</span>
        </div>
        <FooterCol title="Explore" links={[["/menu", "Menu"], ["/nights", "Nights & private hire"], ["/story", "Our story"], ["/journal", "Journal"]]} />
        <FooterCol title="Visit" links={[["/reserve", "Reserve"], ["/reserve#find-us", "Directions"], [site.instagram, "Instagram"], [whatsappUrl(site.whatsapp), "WhatsApp"]]} />
        <FooterCol title="Legal" links={[["/legal/imprint", "Imprint"], ["/legal/privacy", "Privacy"], ["/faq", "FAQ"]]} />
      </div>
      <p className="mx-auto mt-10 max-w-7xl text-xs text-dim">Drink responsibly. Alcohol is only served to guests 18+.</p>
      <div
        aria-hidden
        className="mx-auto mt-16 max-w-7xl select-none bg-gradient-to-b from-[#2a2a2a] to-night to-[92%] bg-clip-text text-center text-[clamp(48px,19vw,300px)] font-bold leading-[0.78] tracking-[-0.07em] text-transparent"
      >
        bushybaby
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-3">
      <span className="label-mono text-[11px]">{title}</span>
      {links.map(([href, label]) =>
        href.startsWith("http") ? (
          <a key={label} href={href} className="text-neutral-300 hover:text-amber" rel="noopener">{label}</a>
        ) : (
          <Link key={label} href={href} className="text-neutral-300 hover:text-amber">{label}</Link>
        ),
      )}
    </nav>
  );
}
