import { useLenis } from './animation/useLenis'
import { useReveals } from './animation/useReveals'
import { Preloader } from './components/Preloader'
import { Header } from './components/layout/Header'
import { Hero } from './sections/Hero'
import { ScentNotes } from './sections/ScentNotes'
import { FeatureShowcase } from './sections/FeatureShowcase'
import { RitualPour } from './sections/RitualPour'
import { ClosingDark } from './sections/ClosingDark'

/**
 * Лендинг NOVAMAGIC. Анимационные блоки — Фаза 2 (GSAP + Lenis + canvas-секвенции).
 */
export function App() {
  useLenis()
  useReveals()

  return (
    <>
      <Header />
      <Hero />
      <ScentNotes />
      <FeatureShowcase />
      <RitualPour />
      <ClosingDark />
      <Preloader />
    </>
  )
}
