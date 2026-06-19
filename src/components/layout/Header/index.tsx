import { Container } from '../Container'
import { headerContent } from './content'
import styles from './Header.module.css'

/**
 * B0 — Header / Nav (SPEC §6).
 * Статичный (не sticky) — прокручивается вместе со страницей.
 * Логотип-метка NOVAMAGIC по центру, переключатель «EN \ RU» справа.
 * Кнопка «Заказать» из макета относится к Hero (B1), не к шапке.
 */
export function Header() {
  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <a className={styles.logo} href="#hero" aria-label={headerContent.logoAlt}>
          <img src="/renders/logo-novamagic.svg" alt={headerContent.logoAlt} />
        </a>
        <button className={styles.lang} type="button">
          {headerContent.langSwitch}
        </button>
      </Container>
    </header>
  )
}
