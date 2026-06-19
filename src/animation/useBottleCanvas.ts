import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { freeSequence, getFrame, loadSequence } from './bottleFrames'

export interface BottleCanvasOpts {
  naturalW: number
  naturalH: number
  mobile?: boolean
  reduce?: boolean
}

/**
 * Рисует кадры секвенции на canvas: contain-fit, dpr-резкость, размер по offset.
 * Кадры — даунскейленные ImageBitmap из общего загрузчика (декод вне главного потока).
 * Секвенция грузится ЛЕНИВО (когда блок близко к вьюпорту) и освобождается, когда блок
 * ушёл далеко. На скролле — только дешёвый drawImage; перерисовка одного кадра
 * коалесцируется в один requestAnimationFrame. Возвращает setFrame(index).
 */
export function useBottleCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  base: string,
  frameCount: number,
  opts: BottleCanvasOpts,
) {
  const cur = useRef(0)
  const pending = useRef(false)
  const drawRef = useRef<() => void>(() => {})
  const { naturalW, naturalH, mobile, reduce } = opts

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const draw = () => {
      pending.current = false
      const img = getFrame(base, cur.current)
      if (!img) return
      const cw = canvas.width
      const ch = canvas.height
      ctx.clearRect(0, 0, cw, ch)
      const ir = img.width / img.height
      const cr = cw / ch
      let dw: number
      let dh: number
      if (ir > cr) {
        dw = cw
        dh = cw / ir
      } else {
        dh = ch
        dw = ch * ir
      }
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
    }
    drawRef.current = draw

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(canvas.offsetWidth * dpr)
      canvas.height = Math.round(canvas.offsetHeight * dpr)
      draw()
    }

    // reduce: статичный кадр — грузим лишь ~5 кадров (включая средний показываемый);
    // мобилка: каждый 2-й кадр + меньше битмап; десктоп: все кадры
    const step = reduce ? Math.max(1, Math.floor(frameCount / 4)) : mobile ? 2 : 1
    const maxEdge = mobile ? 540 : 860
    const scheduleDraw = () => {
      if (pending.current) return
      pending.current = true
      requestAnimationFrame(() => drawRef.current())
    }
    const startLoad = () =>
      loadSequence(base, {
        frameCount,
        naturalW,
        naturalH,
        step,
        maxEdge,
        onFrame: scheduleDraw,
      })

    // ЛЕНИВАЯ загрузка: когда секция близко к вьюпорту; освобождение — когда ушла далеко
    const section = canvas.closest('section') ?? (canvas.parentElement as HTMLElement)
    let freeTimer = 0
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1]
        if (e.isIntersecting) {
          if (freeTimer) {
            clearTimeout(freeTimer)
            freeTimer = 0
          }
          startLoad()
        } else if (!freeTimer) {
          // ушли далеко (за rootMargin) — освобождаем память с задержкой (без трэшинга)
          freeTimer = window.setTimeout(() => {
            freeSequence(base)
            freeTimer = 0
          }, 1500)
        }
      },
      { rootMargin: '150% 0px 150% 0px' },
    )
    io.observe(section)

    window.addEventListener('resize', resize)
    resize()

    return () => {
      io.disconnect()
      if (freeTimer) clearTimeout(freeTimer)
      window.removeEventListener('resize', resize)
    }
  }, [canvasRef, base, frameCount, naturalW, naturalH, mobile, reduce])

  return useCallback(
    (index: number) => {
      const i = index < 0 ? 0 : index > frameCount - 1 ? frameCount - 1 : index
      if (i !== cur.current) {
        cur.current = i
        if (!pending.current) {
          pending.current = true
          requestAnimationFrame(() => drawRef.current())
        }
      }
    },
    [frameCount],
  )
}
