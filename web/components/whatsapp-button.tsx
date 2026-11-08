"use client"

// Floating WhatsApp button (click-to-chat). It is a plain link: nothing is loaded from WhatsApp/Meta
// until the visitor taps it. It appears after the hero, steps aside near the footer and respects reduced motion.

import { useEffect, useState } from "react"


export function WhatsAppButton({ href, label }: { href: string; label: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const y = window.scrollY
      const bottom = document.documentElement.scrollHeight - (y + window.innerHeight)
      // sichtbar nach dem ersten Bildschirm, ausgeblendet über dem Footer (dort steht WhatsApp ohnehin)
      setShow(y > window.innerHeight * 0.6 && bottom > window.innerHeight * 0.9)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      className={`group fixed bottom-5 right-5 z-30 flex h-14 items-center gap-0 overflow-hidden rounded-full bg-[#25d366] pl-4 pr-4 text-[#06210f] shadow-[0_12px_40px_-8px_rgb(37_211_102/0.55)] transition-all duration-500 ease-[var(--nc-ease-out)] hover:gap-2 hover:pr-5 focus-visible:gap-2 focus-visible:pr-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none sm:bottom-7 sm:right-7 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 shrink-0 fill-current">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.43 9.43 0 0 1-4.8-1.31l-.35-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.45-5.02c0-5.2 4.24-9.44 9.46-9.44 2.52 0 4.9.99 6.68 2.77a9.37 9.37 0 0 1 2.77 6.68c0 5.21-4.24 9.44-9.46 9.44zm8.05-17.5A11.32 11.32 0 0 0 12.04.66C5.77.66.66 5.76.66 12.03c0 2 .52 3.96 1.52 5.69L.57 23.6l6.02-1.58a11.35 11.35 0 0 0 5.44 1.39h.01c6.27 0 11.38-5.1 11.38-11.38 0-3.04-1.18-5.9-3.33-8.04z" />
      </svg>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-[max-width] duration-500 ease-[var(--nc-ease-out)] group-hover:max-w-56 group-focus-visible:max-w-56">
        {label}
      </span>
    </a>
  )
}
