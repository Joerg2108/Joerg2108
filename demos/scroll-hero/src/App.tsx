import SmoothScroll from './SmoothScroll';
import Contact from './sections/Contact';
import Header from './sections/Header';
import Hero from './sections/Hero';
import Intro from './sections/Intro';
import Services from './sections/Services';
import Stats from './sections/Stats';

export default function App() {
  return (
    <>
      <a
        href="#inhalt"
        className="sr-only z-[60] rounded-full bg-white text-sm text-black focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:px-4 focus:py-2"
      >
        Zum Inhalt springen
      </a>
      <SmoothScroll />
      <Header />
      <main id="inhalt">
        <Hero />
        <Intro />
        <Services />
        <Stats />
        <Contact />
      </main>
    </>
  );
}
