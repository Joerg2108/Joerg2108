import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CookieSettings } from "@/components/site/cookie-settings";
import { getDictionary } from "@/content/dictionaries";
import { hasLocale, href, locales } from "@/lib/i18n";
import { alternates } from "@/lib/seo";
import { site } from "@/lib/site";

const DOCS = ["imprint", "privacy"] as const;
type Doc = (typeof DOCS)[number];
type Props = { params: Promise<{ lang: string; doc: string }> };

// Exactly two documents per language; anything else is a 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.flatMap((lang) => DOCS.map((doc) => ({ lang, doc })));
}

const isDoc = (d: string): d is Doc => (DOCS as readonly string[]).includes(d);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, doc } = await params;
  if (!hasLocale(lang) || !isDoc(doc)) return {};
  return { title: getDictionary(lang).legal[doc].metaTitle, alternates: alternates(lang, `/legal/${doc}`) };
}

export default async function LegalPage({ params }: Props) {
  const { lang, doc } = await params;
  if (!hasLocale(lang) || !isDoc(doc)) notFound();
  const dict = getDictionary(lang);
  const legal = dict.legal;
  const t = legal[doc];
  const other: Doc = doc === "imprint" ? "privacy" : "imprint";

  return (
    <section className="px-5 pb-32 pt-24 md:px-[clamp(20px,5vw,80px)]">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-16">
        <nav aria-label={legal.imprint.title + " / " + legal.privacy.title} className="flex flex-[1_1_220px] flex-col gap-1 self-start">
          {DOCS.map((d, i) => (
            <Link
              key={d}
              href={href(lang, `/legal/${d}`)}
              aria-current={d === doc ? "page" : undefined}
              className={d === doc ? "flex h-13 items-center justify-between rounded-[14px] border border-white/12 bg-surface-2 px-4 font-medium" : "flex h-13 items-center justify-between rounded-[14px] px-4 text-mist hover:text-moon"}
            >
              {legal[d].title}<span className="font-mono text-[11px] opacity-80">0{i + 1}</span>
            </Link>
          ))}
          <span className="mt-6 px-4 text-[13px] text-dim">{legal.updated}</span>
        </nav>

        <article className="min-w-0 max-w-[720px] flex-[999_1_560px]">
          <h1 className="display text-[clamp(52px,6vw,96px)] leading-[0.9] tracking-[-0.055em]">{t.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-mist">{t.lead}</p>

          {doc === "imprint" ? <ImprintFacts lang={lang} /> : null}

          <div className="mt-12 flex flex-col">
            {t.sections.map((s) => (
              <section key={s.h} className="flex flex-col gap-3 border-t border-white/8 py-8">
                <h2 className="label-mono text-mist">{s.h}</h2>
                <p className="text-[17px] leading-[1.75] text-neutral-300">{s.p.replace("{phone}", site.phoneDisplay ?? "")}</p>
                {"cookies" in s && s.cookies && (
                  <CookieSettings t={dict.cookies} className="mt-2 inline-flex h-12 items-center self-start rounded-full border border-white/15 px-5 font-medium hover:border-white/35" />
                )}
              </section>
            ))}
          </div>
          <Link href={href(lang, `/legal/${other}`)} className="mt-4 inline-flex text-amber underline-offset-4 hover:underline">{legal[other].title} →</Link>
        </article>
      </div>
    </section>
  );
}

function ImprintFacts({ lang }: { lang: "en" | "de" }) {
  const dict = getDictionary(lang);
  const t = dict.legal.imprint;
  const o = site.operator;
  const f = t.fallbacks;
  const rows: [string, React.ReactNode][] = [
    [t.labels.operator, o.legalName ?? f.legalName],
    [t.labels.representative, o.representative ?? f.representative],
    [t.labels.address, <>{o.street ?? site.address.street ?? f.street}<br />{o.town ?? site.address.town ?? f.town}, {dict.common.country}</>],
    [t.labels.contact, <>WhatsApp / Tel. <a href={`tel:+${site.whatsapp}`} className="underline-offset-4 hover:underline">{site.phoneDisplay}</a>{site.email ? <><br /><a href={`mailto:${site.email}`}>{site.email}</a></> : null}</>],
    [t.labels.registration, o.businessRegNo ?? f.reg],
    [t.labels.tax, o.kraPin ?? f.tax],
    [t.labels.licence, o.liquorLicence ?? f.licence],
    [t.labels.responsible, o.representative ?? f.representative],
  ];
  return (
    <dl className="mt-10 overflow-hidden rounded-card border border-white/10">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 border-b border-white/8 px-6 py-4 last:border-0 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
          <dt className="label-mono pt-0.5">{k}</dt>
          <dd className="leading-relaxed">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
