import type { ReactNode } from 'react'
import styles from './GlassCard.module.css'

interface GlassCardProps {
  children: ReactNode
  className?: string
}

/**
 * Карточка из матового стекла (узел 116:35).
 * bg/border/blur — токены --glass-* (SPEC §4).
 */
export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div className={className ? `${styles.card} ${className}` : styles.card}>
      {children}
    </div>
  )
}
