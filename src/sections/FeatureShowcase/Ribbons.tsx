import { forwardRef } from 'react'
import styles from './Ribbons.module.css'

// Крупные изгибистые траектории через весь блок (viewBox 1440×760, растягивается).
const PATHS = [
  'M-140 240 C 200 40, 430 380, 700 250 S 1080 30, 1250 300 S 1400 650, 1640 470',
  'M-140 560 C 260 690, 520 360, 780 520 S 1140 740, 1320 470 S 1480 200, 1640 430',
]

/**
 * Фоновый узор feature-блока «Очищает…»: лента-«змейка» — крупный изгибистый SVG-path,
 * который РИСУЕТСЯ вдоль своей траектории по скроллу (stroke-dashoffset), а не едет вбок.
 * Видны начало и конец сегмента; он вьётся через блок (заходит, петляет, уходит).
 * dasharray/offset гонит родитель (FeatureShowcase) тем же ScrollTrigger; data-band → выбор.
 * z-index 0 — ПОД контентом. reduced-motion: путь нарисован целиком, без анимации.
 */
export const Ribbons = forwardRef<HTMLDivElement>(function Ribbons(_, ref) {
  return (
    <div ref={ref} className={styles.ribbons} aria-hidden="true">
      <svg className={styles.svg} viewBox="0 0 1440 760" preserveAspectRatio="none">
        {PATHS.map((d, i) => (
          <path key={i} data-band={i} className={`${styles.line} ${i === 0 ? styles.l0 : styles.l1}`} d={d} />
        ))}
      </svg>
    </div>
  )
})
