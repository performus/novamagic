import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Entrance-reveals (SPEC §8, Фаза 2): мягкий fade + slide-up элементов
 * с классом `.reveal` при входе в вьюпорт, со стаггером по группам.
 * prefers-reduced-motion обрабатывается в CSS (контент сразу виден),
 * поэтому здесь при reduce просто выходим.
 */
export function initReveals(): () => void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return () => {}

  const els = gsap.utils.toArray<HTMLElement>('.reveal')
  if (!els.length) return () => {}

  gsap.set(els, { opacity: 0, y: 20 })

  const triggers = ScrollTrigger.batch(els, {
    start: 'top 95%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.1,
        overwrite: true,
      }),
  })

  return () => triggers.forEach((t) => t.kill())
}
