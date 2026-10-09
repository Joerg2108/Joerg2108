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
      <SmoothScroll />
      <Header />
      <main>
        <Hero />
        <Intro />
        <Services />
        <Stats />
        <Contact />
      </main>
    </>
  );
}
