import { useEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initReveals } from './reveals'
import { initTextReveal } from './textReveal'

/**
 * Подключает entrance-reveals и обновляет позиции триггеров после полной
 * загрузки (картинки меняют высоту страницы).
 */
export function useReveals() {
  useEffect(() => {
    const cleanup = initReveals()
    const cleanupText = initTextReveal()
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    const t = window.setTimeout(refresh, 400)
    return () => {
      window.removeEventListener('load', refresh)
      window.clearTimeout(t)
      cleanup()
      cleanupText()
    }
  }, [])
}
