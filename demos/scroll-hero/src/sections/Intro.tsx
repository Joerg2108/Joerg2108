import ScrollReveal from '../components/ScrollReveal/ScrollReveal';
import { useReducedMotion } from '../useReducedMotion';

const TEXT =
  'Wir schützen Gebäude, Menschen und Veranstaltungen. Geprüftes Personal nach § 34a GewO, klare Abläufe und eine Leitstelle, die rund um die Uhr erreichbar ist.';
const TEXT_CLASS = 'text-3xl leading-snug font-semibold sm:text-5xl';

export default function Intro() {
  const reduce = useReducedMotion();

  return (
    <section className="mx-auto max-w-4xl px-4 py-32">
      {reduce ? (
        <p className={TEXT_CLASS}>{TEXT}</p>
      ) : (
        <ScrollReveal baseOpacity={0.1} enableBlur baseRotation={3} blurStrength={6} textClassName={TEXT_CLASS}>
          {TEXT}
        </ScrollReveal>
      )}
    </section>
  );
}
