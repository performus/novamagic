/**
 * Общий загрузчик кадров секвенций бутылки (SPEC §7), оптимизированный под скролл.
 *
 * Кадры декодируются ВНЕ главного потока через createImageBitmap() и сразу
 * ДАУНСКЕЙЛЯТСЯ до экранного размера (~2× от показа) — на скролле остаётся только
 * дешёвый drawImage готового битмапа, без декода/ресемпла в кадре. Секвенция грузится
 * ЛЕНИВО (когда блок подходит к вьюпорту) и ОСВОБОЖДАЕТСЯ, когда блок ушёл далеко
 * (битмапы .close() — не держим всю память вечно). Мобилка — каждый 2-й кадр.
 */
export const FRAME_COUNT = 121 // hero-вращение / feature-зум (manifest hero-bottle)

/** Базовые пути секвенций (кадры: <base>bottle_0001.webp …) */
export const SEQ_HERO = '/sequences/hero-bottle/'
export const SEQ_POUR = '/sequences/pour/'

export const frameUrl = (base: string, i: number) =>
  `${base}bottle_${String(i).padStart(4, '0')}.webp`

interface SeqCache {
  frames: (ImageBitmap | undefined)[]
  step: number
  count: number
  token: number // инвалидирует загрузку при free()/перезагрузке
  loading: boolean
}
const caches = new Map<string, SeqCache>()

/** Размер кадра, вписанный в maxEdge по длинной стороне (сохраняя пропорции). */
function fit(nw: number, nh: number, maxEdge: number) {
  const long = Math.max(nw, nh)
  if (long <= maxEdge) return { w: nw, h: nh }
  const s = maxEdge / long
  return { w: Math.max(1, Math.round(nw * s)), h: Math.max(1, Math.round(nh * s)) }
}

export interface LoadOpts {
  frameCount: number
  naturalW: number
  naturalH: number
  step?: number // 2 = каждый 2-й кадр (мобилка)
  maxEdge?: number // длинная сторона битмапа (px)
  onFrame?: () => void // вызывается по мере появления кадров (для перерисовки)
}

/** Лениво грузит секвенцию: fetch → createImageBitmap(resize) в кэш. Идемпотентна. */
export function loadSequence(base: string, opts: LoadOpts): void {
  const step = opts.step ?? 1
  const maxEdge = opts.maxEdge ?? 860
  let c = caches.get(base)
  // уже грузится ИЛИ загружено с тем же конфигом — не перезапускаем (идемпотентно,
  // не плодим токены при повторных вызовах: acquire/перерисовка-на-промахе)
  if (c && c.step === step && c.count >= opts.frameCount && (c.loading || c.frames.some(Boolean))) {
    if (!c.loading) opts.onFrame?.()
    return
  }
  if (!c) {
    c = { frames: [], step, count: 0, token: 0, loading: false }
    caches.set(base, c)
  }
  c.step = step
  c.count = opts.frameCount
  c.loading = true
  const token = ++c.token
  const cache = c
  const { w, h } = fit(opts.naturalW, opts.naturalH, maxEdge)

  const idx: number[] = []
  for (let i = 0; i < opts.frameCount; i += step) idx.push(i)
  if (idx[idx.length - 1] !== opts.frameCount - 1) idx.push(opts.frameCount - 1)

  let ptr = 0
  const worker = async () => {
    while (ptr < idx.length) {
      const i = idx[ptr++]
      if (cache.token !== token) return
      if (cache.frames[i]) continue
      try {
        const res = await fetch(frameUrl(base, i + 1))
        const blob = await res.blob()
        if (cache.token !== token) return
        // декод + даунскейл вне главного потока
        const bmp = await createImageBitmap(blob, {
          resizeWidth: w,
          resizeHeight: h,
          resizeQuality: 'high',
        })
        if (cache.token !== token) {
          bmp.close()
          return
        }
        cache.frames[i] = bmp
        opts.onFrame?.()
      } catch {
        /* пропускаем битый кадр — getFrame отдаст ближайший */
      }
    }
  }
  // пул из 6 параллельных загрузок (не забиваем сеть/декодер разом)
  const POOL = 6
  Promise.all(Array.from({ length: POOL }, worker)).then(() => {
    if (cache.token === token) cache.loading = false
  })
}

/** Готовый битмап кадра (или ближайший загруженный — для шага 2 и частичной загрузки). */
export function getFrame(base: string, index: number): ImageBitmap | null {
  const c = caches.get(base)
  if (!c) return null
  const exact = c.frames[index]
  if (exact) return exact
  for (let d = 1; d <= 8; d++) {
    if (index - d >= 0 && c.frames[index - d]) return c.frames[index - d]!
    if (index + d < c.frames.length && c.frames[index + d]) return c.frames[index + d]!
  }
  return null
}

/** Освобождает память секвенции (битмапы .close()), отменяет незавершённую загрузку. */
export function freeSequence(base: string): void {
  const c = caches.get(base)
  if (!c) return
  c.token++ // отменяет in-flight воркеры
  for (const f of c.frames) f?.close()
  caches.delete(base)
}

// Рефкаунт активных потребителей по base: одну и ту же секвенцию (напр. SEQ_HERO в
// hero И в FeatureShowcase) могут смотреть несколько блоков. Освобождаем ТОЛЬКО когда
// её не смотрит НИ ОДИН блок — иначе один блок «съедал» кэш у другого (регрессия).
const viewers = new Map<string, number>()
const freeTimers = new Map<string, ReturnType<typeof setTimeout>>()

/** Блок вошёл во вьюпорт: +1 зритель, отмена отложенного free, старт ленивой загрузки. */
export function acquireSequence(base: string, opts: LoadOpts): void {
  viewers.set(base, (viewers.get(base) ?? 0) + 1)
  const t = freeTimers.get(base)
  if (t) {
    clearTimeout(t)
    freeTimers.delete(base)
  }
  loadSequence(base, opts)
}

/** Блок ушёл далеко: −1 зритель; когда зрителей не осталось — отложенный free. */
export function releaseSequence(base: string): void {
  const n = (viewers.get(base) ?? 1) - 1
  if (n > 0) {
    viewers.set(base, n)
    return
  }
  viewers.delete(base)
  if (freeTimers.has(base)) return
  freeTimers.set(
    base,
    setTimeout(() => {
      freeTimers.delete(base)
      if ((viewers.get(base) ?? 0) === 0) freeSequence(base)
    }, 2000),
  )
}

/** Манифест секвенции (public/sequences/<seq>/manifest.json). */
export interface SeqManifest {
  frameCount: number
  width: number
  height: number
}
const manifestCache = new Map<string, Promise<SeqManifest>>()

/** Грузит manifest.json секвенции (frameCount + размеры кадра для aspect-ratio). */
export function loadManifest(base: string): Promise<SeqManifest> {
  let p = manifestCache.get(base)
  if (!p) {
    p = fetch(`${base}manifest.json`)
      .then((r) => r.json())
      .then((m) => ({ frameCount: m.frameCount, width: m.width, height: m.height }))
    manifestCache.set(base, p)
  }
  return p
}
