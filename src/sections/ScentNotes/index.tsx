import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { warmScentContent } from '../WarmScent/content'
import { pyramidContent } from '../FragrancePyramid/content'
import { CLUSTERS } from '../FragrancePyramid/clusters'
import styles from './ScentNotes.module.css'

gsap.registerPlugin(ScrollTrigger)

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const DEG = Math.PI / 180
const N = 3
const ARC_STEP = 22 * DEG // угловой шаг между нотами
const R_BASE = 1400 // базовый радиус «колеса» (центр окружности — ниже экрана)

/**
 * B3 — «Тёплый аромат с восточным характером».
 * Заголовок сверху статичный; 3 карточки-ноты движутся по ДУГЕ большого колеса
 * (центр окружности ниже экрана) по вертикальному скроллу: въезжают снизу-справа,
 * проходят верхнюю точку (прямые, крупные, яркие — активные), уходят вниз-влево.
 */
export function ScentNotes() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const reduce = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[]
    cards.forEach((c) => gsap.set(c, { xPercent: -50, yPercent: -50, transformOrigin: '50% 50%' }))
    const setX = cards.map((c) => gsap.quickSetter(c, 'x', 'px'))
    const setY = cards.map((c) => gsap.quickSetter(c, 'y', 'px'))
    const setRot = cards.map((c) => gsap.quickSetter(c, 'rotation', 'deg'))
    const setScaleX = cards.map((c) => gsap.quickSetter(c, 'scaleX'))
    const setScaleY = cards.map((c) => gsap.quickSetter(c, 'scaleY'))
    const setO = cards.map((c) => gsap.quickSetter(c, 'opacity'))

    let vw = window.innerWidth
    let centerY = 0
    let R = R_BASE

    // раскладка по дуге для общего поворота колеса (spin), forceVisible — для reduce
    const layout = (spin: number, forceVisible: boolean) => {
      for (let i = 0; i < cards.length; i++) {
        const angle = i * ARC_STEP - spin // позже стоящие ноты — справа (положительный угол)
        const cx = vw / 2 + R * Math.sin(angle)
        const cy = centerY - R * Math.cos(angle)
        const t = clamp(Math.cos(angle), 0, 1) // 1 в верхней точке
        setX[i](cx)
        setY[i](cy)
        setRot[i]((angle / DEG) * 0.6) // наклон по касательной к дуге
        const sc = 0.85 + 0.2 * t
        setScaleX[i](sc)
        setScaleY[i](sc)
        setO[i](forceVisible ? 1 : 0.4 + 0.6 * t)
      }
    }

    // Активная карточка ставится так, чтобы ВЕРХ картинки был на ~GAP ниже подзаголовка.
    // Зазор держится постоянным на любом вьюпортe — fraction-of-height давал то
    // перекрытие на низких экранах, то провал на широких (картинка шире = выше).
    const GAP = 130
    const measure = () => {
      vw = window.innerWidth
      // на широких экранах радиус растёт → ноты разъезжаются шире по полотну
      R = Math.max(R_BASE, vw * 0.78)
      const headBottom = headingRef.current
        ? headingRef.current.getBoundingClientRect().bottom
        : window.innerHeight * 0.22
      // структурное смещение «центр активной карточки → верх картинки»: ставим card0
      // в верхнюю точку дуги провизорно и меряем (смещение не зависит от самого якоря)
      const provActive = window.innerHeight * 0.6
      centerY = provActive + R
      layout(0, false)
      const c0 = cardRefs.current[0]
      const imgs = c0 ? Array.from(c0.querySelectorAll('img')) : []
      const off = imgs.length
        ? provActive - Math.min(...imgs.map((im) => im.getBoundingClientRect().top))
        : 360
      centerY = headBottom + GAP + off + R
    }
    measure()

    let st: ScrollTrigger | undefined
    if (reduce.current) {
      layout(ARC_STEP, true) // веер: средняя нота по центру, все видны
    } else {
      layout(0, false) // p=0: НАЧАЛО в верхней точке
      st = ScrollTrigger.create({
        trigger: wrapRef.current!,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => layout(self.progress * (N - 1) * ARC_STEP, false),
      })
    }

    const onResize = () => {
      measure()
      if (reduce.current) layout(ARC_STEP, true)
      else layout((st ? st.progress : 0) * (N - 1) * ARC_STEP, false)
    }
    window.addEventListener('resize', onResize)

    return () => {
      st?.kill()
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <section
      ref={wrapRef}
      className={styles.wrap}
      style={reduce.current ? { height: '100vh' } : undefined}
    >
      <div className={styles.sticky}>
        <div ref={headingRef} className={styles.heading}>
          <h2 className={styles.title} data-reveal="head">
            {warmScentContent.title}
          </h2>
          <p className={styles.subtitle} data-reveal="sub">
            {warmScentContent.subtitle}
          </p>
        </div>

        <div className={styles.stage}>
          {pyramidContent.cards.map((card, i) => {
            const cluster = CLUSTERS[card.id]
            return (
              <div
                key={card.id}
                ref={(el) => {
                  cardRefs.current[i] = el
                }}
                className={styles.note}
              >
                <div className={styles.cluster} style={{ aspectRatio: cluster.ar }}>
                  {cluster.imgs.map((img) => (
                    <img
                      key={img.src}
                      className={styles.clusterImg}
                      src={img.src}
                      alt=""
                      aria-hidden="true"
                      style={{ left: `${img.left}%`, top: `${img.top}%`, width: `${img.width}%` }}
                    />
                  ))}
                </div>
                <div className={styles.text}>
                  <span className={styles.category}>{card.category}</span>
                  <p className={styles.notes}>{card.notes}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
