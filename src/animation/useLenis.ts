import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { setLenis, isIntroActive } from './lenisStore'

gsap.registerPlugin(ScrollTrigger)

/**
 * Lenis smooth scroll (SPEC §8, Фаза 2) + интеграция с GSAP ticker и
 * ScrollTrigger, чтобы reveal-анимации и canvas-секвенция шли в одном цикле.
 * Уважает prefers-reduced-motion.
 */
export function useLenis() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    setLenis(lenis)
    if (isIntroActive()) lenis.stop() // пока активен прелоадер — скролл заблокирован

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      setLenis(null)
    }
  }, [])
}
