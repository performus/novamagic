import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** Лёгкий сплит по словам: каждое слово в маске (overflow:hidden) + внутренний span,
 *  который выезжает снизу. Возвращает массив внутренних span'ов для анимации. */
function splitWords(el: HTMLElement): HTMLElement[] {
  if (el.dataset.split === 'done') {
    return Array.from(el.querySelectorAll<HTMLElement>('[data-w]'))
  }
  const inners: HTMLElement[] = []
  const walkText = (node: ChildNode, parent: HTMLElement) => {
    const text = node.textContent ?? ''
    const parts = text.split(/(\s+)/)
    parts.forEach((p) => {
      if (p === '') return
      if (/^\s+$/.test(p)) {
        parent.appendChild(document.createTextNode(p))
        return
      }
      const mask = document.createElement('span')
      mask.style.display = 'inline-block'
      mask.style.overflow = 'hidden'
      mask.style.verticalAlign = 'top'
      const inner = document.createElement('span')
      inner.dataset.w = '1'
      inner.style.display = 'inline-block'
      inner.style.willChange = 'transform, filter, opacity'
      inner.textContent = p
      mask.appendChild(inner)
      parent.appendChild(mask)
      inners.push(inner)
    })
  }
  // каждый прямой ребёнок (span-строка) или текст — отдельная «строка»
  const children = Array.from(el.childNodes)
  if (children.every((n) => n.nodeType === Node.TEXT_NODE)) {
    const txt = el.textContent ?? ''
    el.textContent = ''
    walkText(document.createTextNode(txt) as ChildNode, el)
  } else {
    children.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const c = child as HTMLElement
        const txt = c.textContent ?? ''
        c.textContent = ''
        walkText(document.createTextNode(txt) as ChildNode, c)
      }
    })
  }
  el.dataset.split = 'done'
  return inners
}

/**
 * Единый движок появления текста (мотив прелоадера: маска снизу-вверх + фокусировка).
 *  - data-reveal="head": сплит по словам/строкам, каждое слово выезжает из маски
 *    (translateY 100% + blur 8 + opacity .001 → 0/0/1), stagger, power3.out.
 *  - data-reveal="sub": fade-up + blur, чуть позже своего заголовка.
 * Триггер — вход в ~85% вьюпорта, ОДИН раз (в т.ч. в pin/sticky блоках — без повторов).
 * prefers-reduced-motion — instant fade-in, без transform/blur.
 */
export function initTextReveal(): () => void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const heads = gsap.utils.toArray<HTMLElement>('[data-reveal="head"]')
  const subs = gsap.utils.toArray<HTMLElement>('[data-reveal="sub"]')
  const triggers: ScrollTrigger[] = []

  if (reduce) {
    gsap.set([...heads, ...subs], { autoAlpha: 1, clearProps: 'filter,transform' })
    return () => {}
  }

  heads.forEach((el) => {
    const inners = splitWords(el)
    gsap.set(el, { autoAlpha: 1 })
    gsap.set(inners, { yPercent: 110, filter: 'blur(8px)', autoAlpha: 0.001 })
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () =>
        gsap.to(inners, {
          yPercent: 0,
          filter: 'blur(0px)',
          autoAlpha: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.06,
          overwrite: true,
          // снимаем blur-фильтр после ревила — не держим растровый слой постоянно
          onComplete: () => gsap.set(inners, { clearProps: 'filter' }),
        }),
    })
    triggers.push(st)
  })

  subs.forEach((el) => {
    gsap.set(el, { y: 16, filter: 'blur(6px)', autoAlpha: 0 })
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () =>
        gsap.to(el, {
          y: 0,
          filter: 'blur(0px)',
          autoAlpha: 1,
          duration: 0.7,
          delay: 0.15, // догоняет свой заголовок
          ease: 'power2.out',
          overwrite: true,
          onComplete: () => gsap.set(el, { clearProps: 'filter' }),
        }),
    })
    triggers.push(st)
  })

  return () => triggers.forEach((t) => t.kill())
}
