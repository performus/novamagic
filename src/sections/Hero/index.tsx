import HeroBottleSequence from '../../animation/HeroBottleSequence'
import { useIsMobile } from '../../animation/useIsMobile'
import { OrderButtons } from '../../components/ui/OrderButtons'
import { GlassCard } from '../../components/ui/GlassCard'
import { Container } from '../../components/layout/Container'
import { HeroMobile } from './HeroMobile'
import { Intro } from '../Intro'
import { heroContent } from './content'
import { introContent } from '../Intro/content'
import styles from './Hero.module.css'

/**
 * B1 + B2.
 * Десктоп: единый запиненный переход hero→B2 (canvas-секвенция вращения, HeroBottleSequence).
 * Мобилка (≤767px): лёгкий hero без скролл-секвенции (HeroMobile, idle-покачивание бутылки)
 * + блок B2 (Intro) обычным потоком. Тяжёлый pin/canvas на мобилке НЕ монтируется.
 */
export function Hero() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <>
        <HeroMobile />
        <Intro />
      </>
    )
  }

  const heroLayer = (
    <div className={styles.hero} id="hero">
      <img
        className={`${styles.wordmark} reveal`}
        src="/renders/wordmark-novamagic.svg"
        alt={heroContent.wordmarkAlt}
      />
      <img
        className={`${styles.dubaiWind} reveal`}
        src="/renders/dubai-wind.svg"
        alt={heroContent.subwordmarkAlt}
      />

      <div className={styles.stage}>
        <div className={`${styles.lead} reveal`}>
          <p className={styles.leadText}>{heroContent.lead}</p>
          <OrderButtons vertical />
        </div>

        <div className={`${styles.statement} reveal`}>
          {heroContent.statement.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  )

  const introLayer = (
    <Container>
      <GlassCard className={styles.introCard}>
        <p className={styles.introStatement} id="intro">
          {introContent.statement}
        </p>
      </GlassCard>
    </Container>
  )

  return <HeroBottleSequence hero={heroLayer} intro={introLayer} />
}
