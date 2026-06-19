import gsap from 'gsap'

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

// Окна прорисовки лент по прогрессу блока (разнесены) и доля длины пути под сегмент
const RIBBON_WIN: [number, number][] = [
  [0.0, 0.72],
  [0.28, 1.0],
]
const SEG_FRAC = [0.5, 0.42]

/**
 * Драйвер ленты-«змейки»: берёт <path> из контейнера Ribbons, меряет длину каждого,
 * настраивает stroke-dasharray (видимый сегмент + большой разрыв) и возвращает методы
 * для прорисовки вдоль пути через stroke-dashoffset по прогрессу скролла.
 */
export function setupRibbons(root: HTMLElement | null) {
  const paths = root ? (Array.from(root.querySelectorAll('path')) as SVGPathElement[]) : []
  const items = paths.map((p, i) => {
    const len = p.getTotalLength()
    const seg = len * (SEG_FRAC[i] ?? 0.45)
    p.style.strokeDasharray = `${seg} ${len + seg}`
    return { p, len, seg, set: gsap.quickSetter(p, 'strokeDashoffset') }
  })
  return {
    /** reduced-motion: путь нарисован целиком, без анимации */
    static() {
      items.forEach((it) => {
        it.p.style.strokeDasharray = 'none'
        it.set(0)
      })
    },
    /** стартовое состояние: сегмент спрятан до начала пути */
    init() {
      items.forEach((it) => it.set(it.seg))
    },
    /** прогресс p∈[0..1]: сегмент ползёт от начала к концу своего пути в своём окне */
    update(prog: number) {
      items.forEach((it, i) => {
        const [s, e] = RIBBON_WIN[i] ?? [0, 1]
        const local = clamp01((prog - s) / (e - s))
        it.set(it.seg - local * (it.seg + it.len))
      })
    },
  }
}
