import type { Metadata } from "next";
import NotFound from "../not-found";

/**
 * Static copy of the localized 404 for plain static hosting: Netlify's _redirects
 * serves /de/lost (with status 404) for unknown /de/… URLs, /en/lost for the rest.
 */
export const metadata: Metadata = { title: "404", robots: { index: false, follow: false } };

export default function LostPage() {
  return <NotFound />;
}
