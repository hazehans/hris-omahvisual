import type { HTMLAttributes, ReactNode } from 'react'

import styles from './Badge.module.css'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  tone?: BadgeTone
  pulse?: boolean
}

export function Badge({
  children,
  tone = 'neutral',
  pulse = false,
  className = '',
  ...rest
}: BadgeProps) {
  const classes = [styles.badge, styles[tone], pulse ? styles.pulse : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} {...rest}>
      {pulse ? <span className={styles.dot} aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
