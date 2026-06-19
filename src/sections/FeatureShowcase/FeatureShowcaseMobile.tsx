import { useEffect, useRef } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { showcaseContent } from './content'
import { threeInOneContent } from '../ThreeInOne/content'
import styles from './FeatureShowcaseMobile.module.css'

/**
 * Мобильный feature-блок «Очищает. Смягчает. Ароматизирует.» (≤767px).
 * SCROLL-DRIVEN лента (как блок нот): высокая секция + sticky-вьюпорт залипает, и
 * прогресс прокрутки p∈[0..1] гонит lane.scrollLeft — карточки едут слева направо по
 * вертикальному скроллу страницы (тот же Lenis+ScrollTrigger). Только заголовок и
 * карусель плашек. prefers-reduced-motion: ручной свайп (CSS @media), без sticky.
 */
export function FeatureShowcaseMobile() {
  const wrapRef = useRef<HTMLElement>(null)
  const laneRef = useRef<HTMLDivElement>(null)
  const reduce = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (reduce.current) return // ручной свайп — см. @media (prefers-reduced-motion)
    const lane = laneRef.current!
    const st = ScrollTrigger.create({
      trigger: wrapRef.current!,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        // прогресс прохода секции через залипший вьюпорт → горизонтальный скролл ленты
        lane.scrollLeft = self.progress * (lane.scrollWidth - lane.clientWidth)
      },
    })
    return () => st.kill()
  }, [])

  return (
    <section ref={wrapRef} className={styles.wrap}>
      <div className={styles.sticky}>
        <div className={styles.header}>
          <h2 className={styles.heading}>{showcaseContent.heading}</h2>
          <p className={styles.subhead}>
            {threeInOneContent.caption.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        </div>

        {/* Лента — scroll-driven (scrollLeft гонит прогресс); раскладка как была.
            data-lenis-prevent ТОЛЬКО в ручном свайпе (reduced-motion) — иначе он бы создал
            мёртвую зону над лентой и заморозил прогресс страницы. */}
        <div
          ref={laneRef}
          className={styles.lane}
          data-lenis-prevent={reduce.current ? '' : undefined}
        >
          {showcaseContent.cards.map((card) => (
            <div key={card.label} className={styles.plaque}>
              <img className={styles.plaqueRender} src={card.src} alt="" aria-hidden="true" />
              <span className={styles.plaqueLabel}>{card.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
