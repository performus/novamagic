import { footerContent } from '../../layout/Footer/content'
import styles from './OrderButtons.module.css'

/**
 * Две кнопки-маркетплейса (OZON / YANDEX) — как в футере (139:129): зелёный градиент,
 * золотой текст, золотая стрелка-кружок. Внешние ссылки, новая вкладка.
 * vertical — столбиком на всю ширину (для hero/мобилки).
 */
export function OrderButtons({ vertical, className }: { vertical?: boolean; className?: string }) {
  return (
    <div
      className={[styles.actions, vertical ? styles.vertical : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {footerContent.actions.map((action) => (
        <a
          key={action.label}
          className={`${styles.orderBtn} btn-flow`}
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
  )
}
