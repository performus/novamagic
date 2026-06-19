import { OrderButtons } from '../../components/ui/OrderButtons'
import { heroContent } from './content'
import styles from './HeroMobile.module.css'

/**
 * Мобильный hero (≤767px) — без скролл-секвенции (экономим перф).
 * Сверху вниз: вордмарк NOVAMAGIC + «dubai wind», подзаголовок, кнопка «Заказать»,
 * бутылка по центру с лёгким idle-покачиванием (CSS sway, не привязано к скроллу).
 */
export function HeroMobile() {
  return (
    <section className={styles.heroMobile} id="hero">
      <img className={styles.wordmark} src="/renders/wordmark-novamagic.svg" alt={heroContent.wordmarkAlt} />
      <img className={styles.dubaiWind} src="/renders/dubai-wind.svg" alt={heroContent.subwordmarkAlt} />

      <p className={styles.lead}>{heroContent.lead}</p>

      <OrderButtons vertical className={styles.cta} />

      <div className={styles.bottleWrap}>
        <img
          className={styles.bottle}
          src="/sequences/hero-bottle/bottle_0061.webp"
          alt={heroContent.bottleAlt}
        />
      </div>
    </section>
  )
}
