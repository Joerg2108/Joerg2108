import type { MetadataRoute } from "next";
import { defaultLocale, href, locales } from "@/lib/i18n";
import { site } from "@/lib/site";

// Generated once at build time (required for the static export, harmless for the server build).
export const dynamic = "force-static";

// Add /menu, /nights, /story, /journal here once those routes exist.
const routes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/reserve", priority: 0.9, changeFrequency: "monthly" as const },
];

/** One entry per language, each listing all language versions (hreflang in the sitemap). */
export default function sitemap(): MetadataRoute.Sitemap {
  const abs = (p: string) => `${site.url}${p}`;
  return routes.flatMap((r) =>
    locales.map((lang) => ({
      url: abs(href(lang, r.path)),
      lastModified: new Date(),
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((l) => [l, abs(href(l, r.path))])),
          "x-default": abs(href(defaultLocale, r.path)),
        },
      },
    })),
  );
}
