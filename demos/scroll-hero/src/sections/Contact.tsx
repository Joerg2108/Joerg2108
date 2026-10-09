import { useLenis } from 'lenis/react';

export default function Contact() {
  const lenis = useLenis();

  return (
    <section id="kontakt" className="flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <h2 className="text-4xl font-bold sm:text-6xl">Sprechen wir über Ihr Objekt.</h2>
      <p className="mt-4 text-white/60">Fiktive Demo-Firma. Keine echten Kontaktdaten.</p>
      <button
        type="button"
        onClick={() => lenis?.scrollTo(0, { duration: 2 })}
        className="mt-10 rounded-full border border-white/20 px-6 py-3 text-sm transition-colors hover:bg-white hover:text-black"
      >
        Nach oben
      </button>
    </section>
  );
}
