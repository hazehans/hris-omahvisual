import type { ButtonHTMLAttributes, ReactNode } from 'react'

import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
  lens?: boolean
}

export function Button({
  variant = 'secondary',
  children,
  lens = true,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], lens ? 'glass-lens' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}
