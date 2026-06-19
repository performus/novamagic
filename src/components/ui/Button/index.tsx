import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type CommonProps = {
  children: ReactNode
  className?: string
}

type AsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }
type AsAnchor = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

/**
 * Зелёная pill-кнопка из макета (CTA «Заказать», узел 114:63/64).
 * Рендерит <a>, если передан href, иначе <button>.
 */
export function Button(props: AsButton | AsAnchor) {
  const { children, className } = props
  const cls = `${styles.button} btn-flow${className ? ` ${className}` : ''}`

  if ('href' in props && props.href !== undefined) {
    const { children: _c, className: _cn, ...rest } = props
    return (
      <a className={cls} {...rest}>
        {children}
      </a>
    )
  }

  const { children: _c, className: _cn, href: _h, ...rest } = props as AsButton
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
