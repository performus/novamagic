import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useIsMobile } from '../../animation/useIsMobile'
import { closingContent } from './content'
import { footerContent } from '../../components/layout/Footer/content'
import styles from './ClosingDark.module.css'

gsap.registerPlugin(ScrollTrigger)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const ease = gsap.parseEase('power2.inOut')

/**
 * Блок «Дорогое звучание аромата» (Figma 139:50) — closing + footer на ЧЁРНОЙ
 * панели (139:138). Золотые заголовки, тёмно-зелёный вордмарк, рендер бутылки,
 * кнопки OZON/YANDEX, реквизиты.
 *
 * Десктоп: заголовки РАЗДВИГАЮТСЯ по скроллу — на входе блока оба сведены к центру,
 * по мере прокрутки «Дорогое звучание аромата» уезжает влево, «для вещей…» — вправо
 * (translateX, scrub), открывая бутылку между ними. Реверс при скролле вверх.
 * Мобилка (≤767px): вертикальный стек (reorder во @media), без раздвижки.
 */
export function ClosingDark() {
  const isMobile = useIsMobile()
  const sectionRef = useRef<HTMLElement>(null)
  const line1Ref = useRef<HTMLHeadingElement>(null)
  const line2Ref = useRef<HTMLParagraphElement>(null)
  const reduce = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (isMobile) return // мобилка — заголовки по центру, без раздвижки
    const l1 = line1Ref.current!
    const l2 = line2Ref.current!
    const headline = l1.parentElement!
    const setX1 = gsap.quickSetter(l1, 'x', 'px')
    const setX2 = gsap.quickSetter(l2, 'x', 'px')

    // смещения, сводящие каждый заголовок к центру блока (старт)
    let c1 = 0
    let c2 = 0
    const measure = () => {
      const cw = headline.clientWidth
      c1 = (cw - l1.offsetWidth) / 2 // левый текст → вправо к центру
      c2 = (cw - l2.offsetWidth) / 2 // правый текст → влево к центру
    }
    measure()

    let st: ScrollTrigger | undefined
    if (reduce.current) {
      setX1(0)
      setX2(0) // сразу в финальном (разведённом) положении
    } else {
      setX1(c1)
      setX2(-c2) // старт: оба по центру
      st = ScrollTrigger.create({
        trigger: sectionRef.current!,
        start: 'top 80%',
        end: 'top 28%',
        scrub: true,
        onUpdate: (self) => {
          const e = ease(self.progress)
          setX1(lerp(c1, 0, e)) // → влево (финал)
          setX2(lerp(-c2, 0, e)) // → вправо (финал)
        },
      })
    }

    const onResize = () => {
      measure()
      if (reduce.current) {
        setX1(0)
        setX2(0)
      } else if (st) {
        const e = ease(st.progress)
        setX1(lerp(c1, 0, e))
        setX2(lerp(-c2, 0, e))
      }
    }
    window.addEventListener('resize', onResize)
    return () => {
      st?.kill()
      window.removeEventListener('resize', onResize)
    }
  }, [isMobile])

  return (
    <section ref={sectionRef} className={styles.closing} id="footer">
      <div className={styles.panel}>
        <img className={styles.dubaiWind} src="/renders/dubai-wind-139.svg" alt="dubai wind" />

        <div className={styles.headline}>
          <h2 ref={line1Ref} className={styles.line1}>
            {closingContent.line1}
          </h2>
          <p ref={line2Ref} className={styles.line2}>
            {closingContent.line2}
          </p>
        </div>

        <div className={styles.stage}>
          <img className={styles.wordmark} src="/renders/wordmark-139.svg" alt="NOVAMAGIC" />
        </div>

        {/* бутылка упирается в низ панели */}
        <img className={styles.bottle} src="/renders/closing.webp" alt={closingContent.renderAlt} />

        <div className={styles.bottom}>
          <p className={styles.reqs}>{footerContent.legal}</p>
          <div className={styles.actions}>
            {footerContent.actions.map((action) => (
              <a
                key={action.label}
                className={styles.orderBtn}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{action.label}</span>
                <span className={styles.arrow} aria-hidden="true">
                  →
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
