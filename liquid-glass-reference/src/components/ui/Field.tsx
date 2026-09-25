import type { InputHTMLAttributes, ReactNode } from 'react'

import styles from './Field.module.css'

interface FieldShellProps {
  label: string
  children: ReactNode
  className?: string
}

function FieldShell({ label, children, className = '' }: FieldShellProps) {
  return (
    <label className={`${styles.field} ${className}`.trim()}>
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  )
}

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function GlassInput({ label, className = '', ...rest }: GlassInputProps) {
  return (
    <FieldShell label={label}>
      <input className={`${styles.control} ${className}`.trim()} {...rest} />
    </FieldShell>
  )
}

// GlassSelect lives in ./GlassSelect — custom listbox (no native OS menu).
export type { GlassSelectOption, GlassSelectProps } from './GlassSelect'
export { GlassSelect } from './GlassSelect'
