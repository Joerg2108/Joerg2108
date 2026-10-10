const LINKS = [
  { href: '#leistungen', label: 'Leistungen' },
  { href: '#zahlen', label: 'Zahlen' },
  { href: '#kontakt', label: 'Kontakt' }
];

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a
          href="#top"
          className="font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-2"
        >
          Wachwerk
          <span className="text-accent-2" aria-hidden="true">
            .
          </span>
        </a>
        <ul className="flex gap-4 text-sm text-white/70 sm:gap-8">
          {LINKS.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-2"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
