import { notFound } from "next/navigation";

// Any unknown path inside a language (/de/does-not-exist) → the localized 404 in [lang]/not-found.tsx.
export default function CatchAll() {
  notFound();
}
