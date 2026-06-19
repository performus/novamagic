import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SEQ_POUR } from '../../animation/bottleFrames'
import { useBottleCanvas } from '../../animation/useBottleCanvas'
import { useSeqManifest } from '../../animation/useSeqManifest'
import { useIsMobile } from '../../animation/useIsMobile'
import { RitualPourMobile } from './RitualPourMobile'
import { Pill } from '../../components/ui/Pill'
import { ritualContent } from '../Ritual/content'
import { compositionContent } from '../Composition/content'
import styles from './RitualPour.module.css'

gsap.registerPlugin(ScrollTrigger)

/**
 * Блок «Отмерьте. Добавьте. Запустите.» (Figma 139:50).
 * Заголовок слева сверху; БОКОВОЙ пролив — canvas-секвенция якорем к ПРАВОМУ краю
 * (дно бутылки уходит за край), струя течёт вниз-влево; карточка характеристик
 * (139:99) слева снизу, не перекрывая бутылку/струю. frameCount и aspect берутся
 * из manifest.json (секвенция авто-подхватывается). Отрисовка — useBottleCanvas.
 *
 * Мобилка (≤767px): вертикальный стек (RitualPourMobile) — заголовок, пролив крупно,
 * карточка отдельно ниже; пролив анимируется.
 */
export function RitualPour() {
  const isMobile = useIsMobile()
  return isMobile ? <RitualPourMobile /> : <RitualPourDesktop />
}

function RitualPourDesktop() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduce = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const mf = useSeqManifest(SEQ_POUR)
  const frameCount = mf?.frameCount ?? 1
  const setFrame = useBottleCanvas(canvasRef, SEQ_POUR, frameCount, {
    naturalW: mf?.width ?? 1664,
    naturalH: mf?.height ?? 1248,
    reduce: reduce.current,
  })

  useEffect(() => {
    const wrap = wrapRef.current!
    // контент раскрывается на ТОМ ЖЕ прогрессе, что и пролив (один источник)
    const pills = Array.from(wrap.querySelectorAll<HTMLElement>(`.${styles.pill}`))
    const items = (
      [
        [wrap.querySelector<HTMLElement>(`.${styles.title}`), 0.05, 0.1],
        [wrap.querySelector<HTMLElement>(`.${styles.subtitle}`), 0.15, 0.1],
        [pills[0], 0.24, 0.09], // «1000 мл» ~0.30
        [pills[1], 0.44, 0.09], // «до 36 стирок» ~0.50
        [pills[2], 0.64, 0.09], // «от 20 градусов» ~0.70
        [wrap.querySelector<HTMLElement>(`.${styles.formula}`), 0.74, 0.1], // формула ~0.80
      ] as [HTMLElement | null, number, number][]
    ).filter((it): it is [HTMLElement, number, number] => !!it[0])

    const apply = (el: HTMLElement, t: number) => {
      const e = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t)
      el.style.opacity = String(e)
      el.style.transform = `translateY(${(1 - e) * 18}px)`
      el.style.filter = e >= 1 ? 'none' : `blur(${(1 - e) * 6}px)`
    }

    let st: ScrollTrigger | undefined
    if (reduce.current) {
      setFrame(Math.floor(frameCount / 2))
      items.forEach(([el]) => apply(el, 1)) // статично всё видно
    } else {
      setFrame(0)
      items.forEach(([el]) => apply(el, 0))
      st = ScrollTrigger.create({
        trigger: wrap,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress
          setFrame(Math.round(p * (frameCount - 1)))
          // контент проявляется шаг за шагом, пока бутылка наливает
          items.forEach(([el, start, len]) => apply(el, (p - start) / len))
        },
      })
    }
    return () => st?.kill()
  }, [setFrame, frameCount])

  return (
    <section
      ref={wrapRef}
      className={styles.wrap}
      style={reduce.current ? { height: '100vh' } : undefined}
    >
      <div className={styles.sticky}>
        <div className={styles.heading}>
          <h2 className={styles.title}>{ritualContent.title}</h2>
          <p className={styles.subtitle}>{ritualContent.eyebrow}</p>
        </div>

        {/* Боковой пролив — canvas якорем к правому краю; aspect из manifest */}
        <div className={styles.pour}>
          <div
            className={styles.pourBox}
            style={mf ? { aspectRatio: `${mf.width} / ${mf.height}` } : undefined}
          >
            <canvas ref={canvasRef} className={styles.canvas} />
          </div>
        </div>

        {/* Фото-карточка характеристик (139:99) */}
        <div className={styles.card}>
          <img className={styles.cardBg} src="/renders/composition-card.webp" alt={compositionContent.wordmarkAlt} />
          {compositionContent.pills.map((pill) => (
            <Pill
              key={pill.label}
              className={styles.pill}
              style={{ left: `${pill.left}%`, top: `${pill.top}%` }}
            >
              {pill.label}
            </Pill>
          ))}
          <p className={styles.formula}>{compositionContent.formula}</p>
        </div>
      </div>
    </section>
  )
}
