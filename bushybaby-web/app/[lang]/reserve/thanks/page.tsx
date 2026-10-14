import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ThanksView } from "./thanks-view";
import { getDictionary } from "@/content/dictionaries";
import { hasLocale } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: getDictionary(lang).thanks.metaTitle, robots: { index: false } };
}

// Static shell; the booking details are read from the URL in the browser (thanks-view.tsx).
export default async function ThanksPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <Suspense fallback={<div className="min-h-[80svh]" />}>
      <ThanksView lang={lang} t={getDictionary(lang).thanks} />
    </Suspense>
  );
}
