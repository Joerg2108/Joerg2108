import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SERVICES = [
  { nr: '01', title: 'Objektschutz', text: 'Empfangs- und Pfortendienst, Zutrittskontrolle, Schließrunden.' },
  { nr: '02', title: 'Revierdienst', text: 'Unregelmäßige Kontrollfahrten, Alarmverfolgung, Schlüsselverwaltung.' },
  { nr: '03', title: 'Veranstaltungen', text: 'Einlass, Ordnerdienst und Crowd-Management nach Sicherheitskonzept.' },
  { nr: '04', title: 'Baustellen', text: 'Bewachung nach Feierabend, Videoüberwachung mit Aufschaltung.' }
];

/** Vertical scroll drives a horizontal track while the section is pinned. */
export default function Services() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // Pin only on wide screens and only without reduced motion; otherwise the cards stack.
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth;
        gsap.to(el, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true
          }
        });
      });
    },
    { scope: section }
  );

  return (
    <section id="leistungen" ref={section} className="overflow-hidden">
      <div className="flex min-h-svh flex-col justify-center py-24">
        <h2 className="mb-12 px-4 text-sm tracking-[0.3em] text-white/50 uppercase md:px-16">Leistungen</h2>
        <div ref={track} className="flex flex-col gap-6 px-4 md:w-max md:flex-row md:px-16">
          {SERVICES.map(s => (
            <article
              key={s.nr}
              className="flex min-h-72 flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:h-[60vh] md:w-[38vw]"
            >
              <span className="font-mono text-accent-2">{s.nr}</span>
              <div>
                <h3 className="mb-3 text-3xl font-semibold md:text-5xl">{s.title}</h3>
                <p className="max-w-sm text-white/60">{s.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
