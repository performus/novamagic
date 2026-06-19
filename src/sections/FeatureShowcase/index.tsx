import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FRAME_COUNT, SEQ_HERO } from '../../animation/bottleFrames'
import { useBottleCanvas } from '../../animation/useBottleCanvas'
import { useIsMobile } from '../../animation/useIsMobile'
import { FeatureShowcaseMobile } from './FeatureShowcaseMobile'
import { Ribbons } from './Ribbons'
import { setupRibbons } from './ribbonsDrive'
import { showcaseContent } from './content'
import { threeInOneContent } from '../ThreeInOne/content'
import styles from './FeatureShowcase.module.css'

gsap.registerPlugin(ScrollTrigger)

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep = (t: number) => t * t * (3 - 2 * t)

// Параллакс плашек: дистанция по Y (px) за прогресс — разные скорости = глубина
const CARD_SPEED = [2400, 2800, 2550, 2950]

// Точки, где каждая плашка проходит центр (разнесены по прогрессу) — параллакс-поток
const CARD_PC = [0.16, 0.38, 0.6, 0.82]

/** Стартовое опускание бутылки (px) — адаптивно по высоте вьюпорта, чтобы зазор
 *  подзаголовок→бутылка держался ~100px и на коротких, и на высоких экранах
 *  (крупная бутылка на коротком экране иначе лезет на заголовок). */
const bottleDropPx = () => Math.max(190, 490 - 0.175 * window.innerHeight)

// Фон блока по прогрессу: кремовый → шалфейный → кремовый (плавно, без скачков на стыках)
const BG_CREAM = [247, 242, 231] // #F7F2E7
const BG_GREEN = [203, 213, 190] // #CBD5BE
function bgColor(p: number): string {
  const t = p < 0.15 ? p / 0.15 : p < 0.85 ? 1 : 1 - (p - 0.85) / 0.15
  const r = Math.round(lerp(BG_CREAM[0], BG_GREEN[0], t))
  const g = Math.round(lerp(BG_CREAM[1], BG_GREEN[1], t))
  const b = Math.round(lerp(BG_CREAM[2], BG_GREEN[2], t))
  return `rgb(${r}, ${g}, ${b})`
}

/** Вертикальный поток: плашка выезжает СНИЗУ (+y), проходит центр (y=0), уходит ВВЕРХ (−y)
 *  и тает. Скорость speed>«скролл» (px за прогресс) — обгон = параллакс-глубина. */
function cardVState(p: number, pc: number, speed: number): { y: number; op: number } {
  const y = speed * (pc - p) // p<pc → снизу; p>pc → сверху
  const d = Math.abs(y)
  const op = clamp01(1 - (d - 150) / 320) // полная в ±150px, гаснет к ±470px
  return { y, op }
}

/**
 * Feature-блок «Очищает. Смягчает. Ароматизирует.» (по мотивам more-nutrition).
 * Один pin-контейнер; прогресс p∈[0..1] (scrub) гонит:
 *   - кадр бутылки (частичный оборот на hero-кадрах);
 *   - бутылка сильно увеличивается (0.85→1.7) и к концу уезжает вниз за край с лёгким наклоном;
 *   - 4 плашки (реальные рендеры из Figma) по очереди въезжают слева/справа.
 * Бутылка (z2) поверх плашек (z1). Отрисовка кадров — общий useBottleCanvas.
 *
 * Мобилка (≤767px): отдельный лёгкий вариант (FeatureShowcaseMobile) — заливные
 * плашки по центру + бутылка одним кадром поверх; тяжёлый canvas НЕ монтируется.
 */
export function FeatureShowcase() {
  const isMobile = useIsMobile()
  return isMobile ? <FeatureShowcaseMobile /> : <FeatureShowcaseDesktop />
}

function FeatureShowcaseDesktop() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const ribbonsRef = useRef<HTMLDivElement>(null)
  const reduce = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const setFrame = useBottleCanvas(canvasRef, SEQ_HERO, FRAME_COUNT, {
    naturalW: 1080,
    naturalH: 1920,
    reduce: reduce.current,
  })

  useEffect(() => {
    const canvas = canvasRef.current!
    gsap.set(canvas, { transformOrigin: '50% 50%' })
    const setScaleX = gsap.quickSetter(canvas, 'scaleX')
    const setScaleY = gsap.quickSetter(canvas, 'scaleY')
    const setScale = (s: number) => {
      setScaleX(s)
      setScaleY(s)
    }
    const setY = gsap.quickSetter(canvas, 'y', 'px')
    const setCanvasO = gsap.quickSetter(canvas, 'opacity')

    const setHeaderO = gsap.quickSetter(headerRef.current!, 'opacity')

    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[]
    const setX = cards.map((c) => gsap.quickSetter(c, 'x', 'px'))
    const setO = cards.map((c) => gsap.quickSetter(c, 'opacity'))
    const setCardY = cards.map((c) => gsap.quickSetter(c, 'y', 'px'))
    cards.forEach((c) => gsap.set(c, { yPercent: -50 }))

    // Лента-змейка: рисуется вдоль пути по скроллу (stroke-dashoffset)
    const ribbons = setupRibbons(ribbonsRef.current)

    const wrap = wrapRef.current!

    let st: ScrollTrigger | undefined
    if (reduce.current) {
      setFrame(Math.floor(FRAME_COUNT / 2))
      setScale(0.9) // финальный размер
      setY(0) // по центру
      setCanvasO(1)
      setHeaderO(1)
      cards.forEach((c, i) => gsap.set(c, { x: 0, opacity: 1, y: (i - 1.5) * 200 }))
      ribbons.static() // лента нарисована целиком, без движения
      wrap.style.backgroundColor = 'rgb(203, 213, 190)' // статичный шалфейный фон блока (#CBD5BE)
    } else {
      setFrame(0)
      setScale(1.6) // старт — крупная
      setY(bottleDropPx()) // опущена вниз (ближе к заголовку, адаптивно по высоте)
      setCanvasO(1)
      setHeaderO(1)
      cards.forEach((_, i) => {
        setX[i](0)
        setO[i](0)
        setCardY[i]((CARD_SPEED[i] ?? 2500) * (CARD_PC[i] ?? 0.5)) // старт: снизу за экраном
      })
      ribbons.init()
      wrap.style.backgroundColor = bgColor(0) // старт — кремовый (стык с соседним блоком)

      st = ScrollTrigger.create({
        trigger: wrapRef.current!,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress

          setFrame(Math.round(p * (FRAME_COUNT - 1)))
          // финал (0.8→1): бутылка УХОДИТ вверх синхронно с последней плашкой —
          // дрейф вверх + гаснет + лёгкий scale (нет одинокого зависания)
          const exit = clamp01((p - 0.8) / 0.2)
          // бутылка: старт крупная и опущена вниз → уменьшается и встаёт по центру
          const e = smoothstep(p)
          setScale(lerp(1.6, 0.9, e) * (1 - 0.06 * exit))
          setY(lerp(bottleDropPx(), 0, e) - 120 * exit)
          setCanvasO(1 - exit)
          // шапка (заголовок + подзаголовок) тает по мере проигрывания секвенции
          setHeaderO(1 - clamp01(p / 0.3))

          ribbons.update(p) // лента ползёт вдоль пути
          wrap.style.backgroundColor = bgColor(p) // плавная смена фона по прогрессу

          for (let i = 0; i < cards.length; i++) {
            // плашки строго снизу вверх (без бокового захода), параллакс по Y
            const { y, op } = cardVState(p, CARD_PC[i] ?? 0.5, CARD_SPEED[i] ?? 2500)
            setCardY[i](y)
            setO[i](op)
          }
        },
      })
    }

    return () => {
      st?.kill()
      wrap.style.backgroundColor = '' // вернуть фон странице (CSS)
    }
  }, [setFrame])

  return (
    <section ref={wrapRef} className={styles.wrap} style={reduce.current ? { height: '100vh' } : undefined}>
      <div className={styles.sticky}>
        <Ribbons ref={ribbonsRef} />
        <div ref={headerRef} className={styles.header}>
          <h2 className={styles.heading} data-reveal="head">
            {showcaseContent.heading}
          </h2>
          <p className={styles.subhead} data-reveal="sub">
            {threeInOneContent.caption.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        </div>

        <div className={styles.cards}>
          {showcaseContent.cards.map((card, i) => (
            <div
              key={card.label}
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              className={`${styles.card} ${i % 2 === 0 ? styles.left : styles.right}`}
            >
              <div className={styles.glass}>
                <span className={styles.label}>{card.label}</span>
              </div>
              <img
                className={styles.render}
                src={card.src}
                alt=""
                aria-hidden="true"
                style={{
                  right: `${card.img.right}%`,
                  top: `${card.img.top}%`,
                  width: `${card.img.width}%`,
                  transform: `scale(${card.img.scale})`,
                }}
              />
            </div>
          ))}
        </div>

        <div className={styles.canvasWrap}>
          <div className={styles.canvasBox}>
            <canvas ref={canvasRef} className={styles.canvas} />
          </div>
        </div>
      </div>
    </section>
  )
}
