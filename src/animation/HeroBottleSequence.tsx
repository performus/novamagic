import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FRAME_COUNT, SEQ_HERO } from './bottleFrames'
import { useBottleCanvas } from './useBottleCanvas'
import styles from './HeroBottleSequence.module.css'

gsap.registerPlugin(ScrollTrigger)

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const ease = gsap.parseEase('power2.inOut')
const easeOut = gsap.parseEase('power2.out')

/** Прогресс кадра: фаза 1 (hero, p≤0.5) — ровно, ~72% оборота; фаза 2 (переход) —
 *  мягче/медленнее (ease), оставшиеся 28% кадров растянуты на половину скролла. */
function frameProgress(p: number): number {
  if (p <= 0.5) return (p / 0.5) * 0.72
  return 0.72 + ease(clamp01((p - 0.5) / 0.5)) * 0.28
}

/**
 * HeroBottleSequence (SPEC §7, Фаза 2) — единый непрерывный переход hero → B2.
 * Секция пинится; прогресс скролла p∈[0..1] гонит всё:
 *   - фаза 1 (hero): бутылка по центру, вращается по скроллу, наклон 30°→0°;
 *   - фаза 2 (переход): бутылка мягко доворачивается (медленнее) и УЕЗЖАЕТ ВПРАВО
 *     (translateX к правой зоне), оставаясь НЕПРОЗРАЧНОЙ;
 *   - heroText: p 0.00→0.45 уезжает вверх и тает;
 *   - introText (B2) появляется СЛЕВА: translateX −6vw→0, opacity 0→1.
 * Текст слева и бутылка справа не пересекаются → читаемость без затемнения.
 * Отрисовка кадров — общий хук useBottleCanvas. z: hero(1) < бутылка(2) < B2(3).
 */
export default function HeroBottleSequence({ hero, intro }: { hero: ReactNode; intro: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
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

    const setHeroY = gsap.quickSetter(heroRef.current!, 'y', 'px')
    const setHeroO = gsap.quickSetter(heroRef.current!, 'opacity')
    const setIntroX = gsap.quickSetter(introRef.current!, 'x', 'px')
    const setIntroO = gsap.quickSetter(introRef.current!, 'opacity')

    gsap.set(canvas, { transformOrigin: '50% 60%', opacity: 1 })
    const setCanvasX = gsap.quickSetter(canvas, 'x', 'px')
    const setCanvasRot = gsap.quickSetter(canvas, 'rotation', 'deg')

    const vw = () => window.innerWidth

    let st: ScrollTrigger | undefined
    if (reduce.current) {
      // финальная статичная компоновка перехода: B2 слева, бутылка справа, наклон 0
      setFrame(Math.floor(FRAME_COUNT / 2))
      setHeroY(-120)
      setHeroO(0)
      setIntroX(0)
      setIntroO(1)
      setCanvasX(0.28 * vw())
      setCanvasRot(0)
    } else {
      setFrame(0)
      setHeroY(0)
      setHeroO(1)
      setIntroX(-0.06 * vw())
      setIntroO(0)
      setCanvasX(0)
      setCanvasRot(30)

      st = ScrollTrigger.create({
        trigger: wrapRef.current!,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress
          const w = vw()

          // бутылка: кадр (мягче во 2-й фазе), наклон 30°→0° к p≈0.7, уезд вправо во 2-й половине
          setFrame(Math.round(frameProgress(p) * (FRAME_COUNT - 1)))
          setCanvasRot(30 * (1 - ease(clamp01(p / 0.7))))
          setCanvasX(0.28 * w * easeOut(clamp01((p - 0.5) / 0.5)))

          // hero-текст уезжает вверх и тает (как было)
          const hp = ease(clamp01(p / 0.45))
          setHeroY(-120 * hp)
          setHeroO(1 - hp)

          // текст B2 въезжает СЛЕВА (−6vw→0) и проявляется
          setIntroX(lerp(-0.06 * w, 0, ease(clamp01((p - 0.5) / 0.4))))
          setIntroO(clamp01((p - 0.5) / 0.3))
        },
      })
    }

    return () => st?.kill()
  }, [setFrame])

  return (
    <section
      ref={wrapRef}
      className={styles.wrap}
      style={reduce.current ? { height: '100vh' } : undefined}
    >
      <div className={styles.sticky}>
        <div ref={heroRef} className={styles.heroText}>
          {hero}
        </div>
        <div ref={introRef} className={styles.introText}>
          {intro}
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
