import { Container } from '../layout/Container'
import styles from './SectionPlaceholder.module.css'

interface SectionPlaceholderProps {
  /** id секции — для якорей и навигации */
  id: string
  /** подпись блока, видна по центру заглушки */
  label: string
  /** примерная высота блока (px из пропорций фрейма 1920×7911) */
  minHeight: number
  /** sticky-поведение (для хедера B0) */
  sticky?: boolean
}

/**
 * Заглушка секции для Фазы 0 (каркас).
 * Рендерит блок заданной высоты с подписью по центру и тонкой рамкой --line,
 * чтобы границы блоков были видны. Реальная вёрстка — Фаза 1.
 */
export function SectionPlaceholder({ id, label, minHeight, sticky }: SectionPlaceholderProps) {
  return (
    <section
      id={id}
      className={sticky ? `${styles.section} ${styles.sticky}` : styles.section}
      style={{ minHeight: `${minHeight}px` }}
    >
      <Container className={styles.inner}>
        <span className={styles.label}>{label}</span>
        <span className={styles.meta}>{minHeight}px</span>
      </Container>
    </section>
  )
}
