import CountUp from '../components/CountUp/CountUp';
import SpotlightCard from '../components/SpotlightCard/SpotlightCard';
import { useReducedMotion } from '../useReducedMotion';

const STATS = [
  { to: 24, suffix: '/7', label: 'Leitstelle besetzt' },
  { to: 180, suffix: '+', label: 'geschulte Kräfte' },
  { to: 12500, suffix: '', label: 'Einsatzstunden pro Monat', separator: '.' },
  { to: 15, suffix: ' min', label: 'Interventionszeit (Ziel)' }
];

export default function Stats() {
  const reduce = useReducedMotion();

  return (
    <section id="zahlen" className="mx-auto max-w-6xl px-4 py-32">
      <h2 className="mb-12 text-sm tracking-[0.3em] text-white/50 uppercase">Zahlen</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(stat => (
          <SpotlightCard key={stat.label} className="rounded-3xl p-8" spotlightColor="rgba(124, 255, 103, 0.2)">
            <div className="text-4xl font-bold tabular-nums">
              {/* Start at the target under reduced motion: the number shows without counting */}
              <CountUp from={reduce ? stat.to : 0} to={stat.to} duration={1.5} separator={stat.separator} />
              {stat.suffix}
            </div>
            <p className="mt-2 text-sm text-white/60">{stat.label}</p>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
}
