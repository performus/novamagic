import type { ReactNode } from 'react'
import styles from './Pill.module.css'

interface PillProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

/** Стеклянная пилюля-характеристика (узел 114:84). */
export function Pill({ children, className, style }: PillProps) {
  return (
    <span className={className ? `${styles.pill} ${className}` : styles.pill} style={style}>
      {children}
    </span>
  )
}
