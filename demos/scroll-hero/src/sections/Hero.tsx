import Aurora from '../components/Aurora/Aurora';
import ShinyText from '../components/ShinyText/ShinyText';
import SplitText from '../components/SplitText/SplitText';
import { useReducedMotion } from '../useReducedMotion';

const HEADLINE = 'Sicherheit, die man spürt.';
const HEADLINE_CLASS = 'text-5xl leading-tight font-bold tracking-tight sm:text-7xl';

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <section id="top" className="relative flex h-svh items-center justify-center overflow-hidden">
      {/* Aurora fills its parent: the parent needs a real height (h-svh above) */}
      <div className="absolute inset-0 -z-10 opacity-80" aria-hidden="true">
        <Aurora colorStops={['#5227ff', '#7cff67', '#5227ff']} amplitude={1} blend={0.5} speed={reduce ? 0 : 0.6} />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-[#07070b]"
      />

      <div className="px-4 text-center">
        <ShinyText
          text="Objektschutz · Revierdienst · Veranstaltungen"
          className="mb-6 text-xs tracking-[0.3em] uppercase sm:text-sm"
          speed={3}
        />
        {reduce ? (
          <h1 className={HEADLINE_CLASS}>{HEADLINE}</h1>
        ) : (
          <SplitText
            text={HEADLINE}
            tag="h1"
            className={HEADLINE_CLASS}
            splitType="chars"
            delay={35}
            duration={1}
            from={{ opacity: 0, y: 60 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0}
            rootMargin="0px"
          />
        )}
        <p className="mx-auto mt-6 max-w-xl text-white/60">
          Demo für Lenis Smooth Scroll, GSAP ScrollTrigger und React-Bits-Komponenten.
        </p>
        <a
          href="#leistungen"
          className="mt-10 inline-block rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-2"
        >
          Leistungen ansehen
        </a>
      </div>
    </section>
  );
}
