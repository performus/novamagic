import type { ReactNode } from 'react'
import styles from './Container.module.css'

interface ContainerProps {
  children: ReactNode
  className?: string
}

/** Центрированный контейнер контента: max-width = var(--container-max), поля по краям. */
export function Container({ children, className }: ContainerProps) {
  return (
    <div className={className ? `${styles.container} ${className}` : styles.container}>
      {children}
    </div>
  )
}
