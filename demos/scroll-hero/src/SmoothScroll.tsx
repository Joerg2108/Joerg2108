import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReactLenis, useLenis } from 'lenis/react';

gsap.registerPlugin(ScrollTrigger);

/**
 * One Lenis instance on <html>, driven by the GSAP ticker so Lenis and
 * ScrollTrigger update in the same frame.
 */
export default function SmoothScroll() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    const update = (time: number) => lenis.raf(time * 1000);
    const off = lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => {
      off();
      gsap.ticker.remove(update);
    };
  }, [lenis]);

  return <ReactLenis root options={{ autoRaf: false, anchors: true, lerp: 0.1 }} />;
}
