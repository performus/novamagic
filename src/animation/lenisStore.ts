import type Lenis from 'lenis'

/** Шаринг Lenis-инстанса между useLenis и прелоадером (стоп/старт скролла). */
let instance: Lenis | null = null
export const setLenis = (l: Lenis | null) => {
  instance = l
}
export const getLenis = () => instance

/** Флаг «интро-прелоадер активен» (первая загрузка). useLenis стартует стопнутым,
 *  пока интро не закончится. Модульный флаг — переживает ре-рендеры. */
let introActive = true
export const isIntroActive = () => introActive
export const endIntro = () => {
  introActive = false
}
