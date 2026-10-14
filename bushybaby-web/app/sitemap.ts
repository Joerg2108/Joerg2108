import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Add /menu, /nights, /story, /journal here once those routes exist.
const routes = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/reserve", priority: 0.9, changeFrequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((r) => ({ url: `${site.url}${r.path}`, lastModified: new Date(), changeFrequency: r.changeFrequency, priority: r.priority }));
}
