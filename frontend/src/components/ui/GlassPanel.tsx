import type { HTMLAttributes, ReactNode } from 'react'

import styles from './GlassPanel.module.css'

interface GlassPanelProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  as?: 'section' | 'div' | 'article'
  padded?: boolean
  rise?: boolean
}

export function GlassPanel({
  children,
  as: Tag = 'section',
  padded = true,
  rise = true,
  className = '',
  ...rest
}: GlassPanelProps) {
  const classes = [
    styles.panel,
    padded ? styles.padded : '',
    rise ? 'liquid-rise' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  )
}
