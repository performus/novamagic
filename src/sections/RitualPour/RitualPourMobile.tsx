import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SEQ_POUR } from '../../animation/bottleFrames'
import { useBottleCanvas } from '../../animation/useBottleCanvas'
import { useSeqManifest } from '../../animation/useSeqManifest'
import { Pill } from '../../components/ui/Pill'
import { ritualContent } from '../Ritual/content'
import { compositionContent } from '../Composition/content'
import styles from './RitualPourMobile.module.css'

gsap.registerPlugin(ScrollTrigger)

/**
 * Мобильный блок «Отмерьте. Добавьте. Запустите.» (≤767px).
 * Заголовок + подзаголовок → ПЛАШКА (тёмно-моховой фон, чипсы + формула, БЕЗ стоящей
 * бутылки) с проливом СВЕРХУ: бутыль-секвенция льёт струю ВНИЗ НА плашку (стрим z-index
 * выше плашки). Под плашкой — футер встык. Одна бутылка в блоке (только пролив).
 */
export function RitualPourMobile() {
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
    mobile: true,
    reduce: reduce.current,
  })

  useEffect(() => {
    const wrap = wrapRef.current!
    // чипсы/формула раскрываются на прогрессе пролива (заголовок — общий reveal-движок выше)
    const pills = Array.from(wrap.querySelectorAll<HTMLElement>(`.${styles.pill}`))
    const items = (
      [
        [pills[0], 0.24, 0.1],
        [pills[1], 0.42, 0.1],
        [pills[2], 0.6, 0.1],
        [wrap.querySelector<HTMLElement>(`.${styles.formula}`), 0.72, 0.12],
      ] as [HTMLElement | null, number, number][]
    ).filter((it): it is [HTMLElement, number, number] => !!it[0])
    const apply = (el: HTMLElement, t: number) => {
      const e = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t)
      el.style.opacity = String(e)
      el.style.transform = `translateY(${(1 - e) * 14}px)`
      el.style.filter = e >= 1 ? 'none' : `blur(${(1 - e) * 5}px)`
    }

    let st: ScrollTrigger | undefined
    if (reduce.current) {
      setFrame(Math.floor(frameCount / 2))
      items.forEach(([el]) => apply(el, 1))
    } else {
      setFrame(0)
      items.forEach(([el]) => apply(el, 0))
      st = ScrollTrigger.create({
        trigger: wrap,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress
          setFrame(Math.round(p * (frameCount - 1)))
          items.forEach(([el, start, len]) => apply(el, (p - start) / len))
        },
      })
    }
    return () => st?.kill()
  }, [setFrame, frameCount])

  return (
    <>
      {/* 1. Заголовок + подзаголовок */}
      <div className={styles.top}>
        <div className={styles.heading}>
          <h2 className={styles.title} data-reveal="head">
            {ritualContent.title}
          </h2>
          <p className={styles.subtitle} data-reveal="sub">
            {ritualContent.eyebrow}
          </p>
        </div>
      </div>

      {/* 2. Плашка с проливом сверху (струя ПОВЕРХ плашки). Под ней — футер встык. */}
      <section ref={wrapRef} className={styles.stage}>
        {/* пролив — сверху, льёт НА плашку (z выше) */}
        <div className={styles.pour}>
          <div
            className={styles.pourBox}
            style={mf ? { aspectRatio: `${mf.width} / ${mf.height}` } : undefined}
          >
            <canvas ref={canvasRef} className={styles.canvas} />
          </div>
        </div>

        {/* плашка — премиальный фотофон (мох/коряга), чипсы + формула */}
        <div className={styles.card}>
          <img className={styles.cardBg} src="/renders/composition-card.webp" alt="" aria-hidden="true" />
          {/* вордмарк NOVAMAGIC / dubai wind поверх фото (Figma 139:50) — как в B8 */}
          <img
            className={styles.wordmark}
            src="/renders/composition-wordmark.svg"
            alt={compositionContent.wordmarkAlt}
          />
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
      </section>
    </>
  )
}
