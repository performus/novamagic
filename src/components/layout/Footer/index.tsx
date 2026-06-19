import { Container } from '../Container'
import { footerContent } from './content'
import styles from './Footer.module.css'

/**
 * B10 — Footer (SPEC §6, y≈7397–7911).
 * Гигантский вордмарк NOVAMAGIC, кнопки маркетплейсов (внешние ссылки)
 * и реквизиты.
 */
export function Footer() {
  return (
    <footer className={styles.footer} id="footer">
      <Container>
        <img
          className={`${styles.wordmark} reveal`}
          src="/renders/wordmark-novamagic.svg"
          alt={footerContent.wordmarkAlt}
        />
        <div className={`${styles.bottom} reveal`}>
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
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  )
}
