import { Container } from '../../components/layout/Container'
import { GlassCard } from '../../components/ui/GlassCard'
import { introContent } from './content'
import styles from './Intro.module.css'

/**
 * B2 — Intro / стеклянная карточка (SPEC §6, y≈1473–1963).
 * Широкая матовая glass-панель (узел 116:35) с крупным центрированным
 * заявлением (узел 114:62).
 */
export function Intro() {
  return (
    <section className={styles.intro} id="intro">
      <Container>
        <GlassCard className={`${styles.card} reveal`}>
          <p className={styles.statement}>{introContent.statement}</p>
        </GlassCard>
      </Container>
    </section>
  )
}
