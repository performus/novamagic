import { useRef, useState, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { getLenis, isIntroActive, endIntro } from '../../animation/lenisStore'
import styles from './Preloader.module.css'

const SUBHEAD = 'dubai wind'
const SCRAMBLE = 'abcdefghijklmnopqrstuvwxyz'
const GREEN = '#105F22'
const CREAM = '#F7F2E7'

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Прелоадер первой загрузки. Цветовой журней: СТАРТ бежевый #F7F2E7 (как сайт) с
 * ЗЕЛЁНЫМ вордмарком NOVAMAGIC. Финал (один таймлайн): вордмарк улетает наверх на место
 * хедер-вордмарка героя (FLIP), ОДНОВРЕМЕННО фон беж → зелёный #105F22, а лого
 * перекрашивается зелёный → кремовый (видно в каждом кадре); затем зелёная штора уходит
 * вверх, открывая бежевый герой, лого хэндофф к зелёному hero-вордмарку. Lenis stop/start.
 * Вордмарк — инлайн SVG (вектор): резкий при любом масштабе, без растрового фильтра.
 * Только первый вход; prefers-reduced-motion — сразу бежевый герой.
 */
export function Preloader() {
  const [show, setShow] = useState(() => isIntroActive())
  const overlayRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const wordmarkRef = useRef<SVGSVGElement>(null)
  const subheadRef = useRef<HTMLParagraphElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    if (!isIntroActive()) return

    // reduced-motion: без анимаций — сразу бежевый герой (оверлей уже бежевый, без вспышки)
    if (prefersReduced()) {
      endIntro()
      getLenis()?.start()
      setShow(false)
      return
    }

    window.scrollTo(0, 0)
    const wm = wordmarkRef.current!
    const sub = subheadRef.current!
    const ctx = gsap.context(() => {
      gsap.set(windowRef.current, { autoAlpha: 0, filter: 'blur(14px)' })
      gsap.set(wm, { autoAlpha: 0, scale: 1.04, color: GREEN }) // лого ЗЕЛЁНОЕ на беже
      gsap.set(sub, { autoAlpha: 0 })

      // ВХОД: окно — фокусировка blur→0; вордмарк — мягкий fade+scale БЕЗ blur (вектор резкий)
      const intro = gsap.timeline()
      intro
        .to(windowRef.current, { autoAlpha: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' })
        .to(wm, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'power2.out' }, 0.15)
        .add(() => scramble(sub), 0.5)

      gsap.fromTo(barRef.current, { scaleX: 0 }, { scaleX: 1, duration: 2.2, ease: 'none' })
    }, overlayRef)

    // держим до load И минимум 2.2s
    const minTime = new Promise<void>((r) => setTimeout(r, 2200))
    const loaded =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise<void>((r) => window.addEventListener('load', () => r(), { once: true }))

    let killed = false
    Promise.all([minTime, loaded]).then(() => {
      if (killed) return
      runExit()
    })

    function runExit() {
      const heroWm = document.querySelector<HTMLElement>('#hero img[src*="wordmark-novamagic"]')
      const tl = gsap.timeline({
        onComplete: () => {
          endIntro()
          getLenis()?.start()
          setShow(false) // оверлей убран из потока — не блокирует клики
        },
      })
      // окно/подзаголовок/линия гаснут
      tl.to([windowRef.current, sub, barRef.current], { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 0)

      // ЦВЕТОВОЙ ЖУРНЕЙ (один таймлайн): фон беж → зелёный И лого зелёное → кремовое
      // (чуть быстрее фона, чтобы лого оставалось видимым на темнеющем фоне)
      tl.to(bgRef.current, { backgroundColor: GREEN, duration: 0.7, ease: 'power2.inOut' }, 0)
      tl.to(wm, { color: CREAM, duration: 0.5, ease: 'power2.inOut' }, 0)

      // FLIP без АПСКЕЙЛА: перерастеризуем SVG СРАЗУ в финальном (hero) размере и
      // анимируем scale ТОЛЬКО ВНИЗ→1 (даунскейл битмапа чёткий, пикселизации роста нет).
      // origin top-left + position:fixed в текущей точке — на свопе картинка не дёргается.
      if (heroWm) {
        const pre = wm.getBoundingClientRect()
        const target = heroWm.getBoundingClientRect()
        const W = target.width // интрин. ширина = размер в хедере (максимум анимации)
        const H = (W * 288) / 1828 // высота по viewBox SVG
        const s0 = pre.width / W // стартовый scale ≤1 (текущий вид = pre.width)
        const preCx = pre.left + pre.width / 2
        const preCy = pre.top + pre.height / 2
        // ставим большой (hero-размер) SVG, центр совпадает с текущим, scale s0 (вид не меняется)
        gsap.set(wm, {
          position: 'fixed',
          margin: 0,
          left: preCx - W / 2,
          top: preCy - H / 2,
          width: W,
          transformOrigin: '50% 50%',
          x: 0,
          y: 0,
          scale: s0,
        })
        tl.to(
          wm,
          {
            x: target.left + target.width / 2 - preCx,
            y: target.top + target.height / 2 - preCy,
            scale: 1, // только ВНИЗ→1: даунскейл крупного растра, апскейла нет
            duration: 1.4,
            ease: 'power3.inOut',
          },
          0.2,
        )
      } else {
        tl.to(wm, { y: -140, duration: 1.3, ease: 'power3.inOut' }, 0.2)
      }

      // зелёная штора СХОДИТ вверх, открывая бежевый герой #F7F2E7 — лого хэндофф к
      // зелёному hero-вордмарку (приземляется зелёным), встык, без наложения экранов
      tl.to(bgRef.current, { yPercent: -100, duration: 0.8, ease: 'power3.inOut' }, 1.05)
      tl.to(wm, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 1.55)
    }

    return () => {
      killed = true
      ctx.revert()
    }
  }, [])

  function scramble(el: HTMLElement) {
    const final = SUBHEAD
    let frame = 0
    const total = 22
    const timer = window.setInterval(() => {
      frame++
      const revealed = Math.floor((frame / total) * final.length)
      el.textContent = final
        .split('')
        .map((ch, i) => (ch === ' ' ? ' ' : i < revealed ? ch : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)]))
        .join('')
      gsap.set(el, { autoAlpha: 1 })
      if (frame >= total) {
        el.textContent = final
        window.clearInterval(timer)
      }
    }, 45)
  }

  if (!show) return null

  return (
    <div ref={overlayRef} className={styles.overlay} aria-hidden="true">
      <div ref={bgRef} className={styles.bg} />
      <div className={styles.content}>
        <div ref={windowRef} className={styles.window}>
          <img className={styles.windowImg} src="/sequences/hero-bottle/bottle_0061.webp" alt="" />
        </div>
        <svg
          ref={wordmarkRef}
          className={styles.wordmark}
          viewBox="0 0 1828 288"
          role="img"
          aria-label="NOVAMAGIC"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g fill="currentColor">
            <path d="M0 278.905V9.09476H40.0494L113.347 197.053V9.09476H149.241V278.905H109.191L36.2711 89.8105V278.905H0Z" />
            <path d="M320.711 288C241.746 288 177.515 223.579 177.515 143.621C177.515 64.8 241.746 0 320.711 0C400.432 0 464.662 64.8 464.662 143.621C464.662 223.579 400.432 288 320.711 288ZM320.711 251.242C380.029 251.242 428.013 203.116 428.013 143.621C428.013 84.8842 380.029 36.7579 320.711 36.7579C262.148 36.7579 214.164 84.8842 214.164 143.621C214.164 203.116 262.148 251.242 320.711 251.242Z" />
            <path d="M527.835 278.905L466.25 9.09476H504.788L548.994 211.453L593.955 9.09476H631.737L570.907 278.905H527.835Z" />
            <path d="M605.351 278.905L671.848 9.09476H707.742L774.239 278.905H736.079L728.9 249.347H649.935L642.756 278.905H605.351ZM659.758 212.211H719.832L689.606 78.4421L659.758 212.211Z" />
            <path d="M795.497 278.905V9.09476H841.214L889.576 216.758L938.315 9.09476H984.787V278.905H948.138V98.1474L907.711 278.905H871.818L831.768 98.1474V278.905H795.497Z" />
            <path d="M1006.05 278.905L1072.55 9.09476H1108.44L1174.94 278.905H1136.78L1129.6 249.347H1050.64L1043.46 278.905H1006.05ZM1060.46 212.211H1120.53L1090.31 78.4421L1060.46 212.211Z" />
            <path d="M1395.09 162.189V125.432H1461.97C1462.72 131.116 1462.72 137.937 1462.72 143.621C1462.72 223.579 1398.12 288 1318.77 288C1239.81 288 1175.58 223.579 1175.58 143.621C1175.58 64.8 1239.81 0 1318.77 0C1357.69 0 1392.45 15.1579 1418.52 40.1684L1393.2 66.6948C1373.93 48.1263 1347.49 36.7579 1318.77 36.7579C1260.21 36.7579 1212.23 84.8842 1212.23 143.621C1212.23 203.116 1260.21 251.242 1318.77 251.242C1372.05 251.242 1415.87 212.211 1424.56 162.189H1395.09Z" />
            <path d="M1491 278.905V9.09476H1528.41V278.905H1491Z" />
            <path d="M1795.13 191.747L1828 208.421C1804.57 255.789 1756.59 288 1699.92 288C1620.95 288 1556.72 223.579 1556.72 143.621C1556.72 64.8 1620.95 0 1699.92 0C1756.59 0 1805.33 32.2105 1828 79.2L1795.13 95.4948C1778.13 60.6316 1742.23 36.7579 1699.92 36.7579C1641.35 36.7579 1593.37 84.8842 1593.37 143.621C1593.37 203.116 1641.35 251.242 1699.92 251.242C1742.23 251.242 1777.37 226.989 1795.13 191.747Z" />
          </g>
        </svg>
        <p ref={subheadRef} className={styles.subhead}>
          {SUBHEAD}
        </p>
      </div>
      <span ref={barRef} className={styles.bar} />
    </div>
  )
}
