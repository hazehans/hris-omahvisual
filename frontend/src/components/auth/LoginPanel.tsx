import { useState, type FormEvent } from 'react'

import { type UiText } from '@/lib/i18n'

import styles from './LoginPanel.module.css'

interface LoginPanelProps {
  text: UiText['auth']
  brand: string
  errorMessage: string | null
  onSubmit: (username: string, password: string) => Promise<boolean>
}

export function LoginPanel({
  text,
  brand,
  errorMessage,
  onSubmit,
}: LoginPanelProps) {
  const [username, setUsername] = useState('demo')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(username.trim(), password)
    } finally {
      setSubmitting(false)
    }
  }

  const displayError =
    errorMessage === 'invalid'
      ? text.errors.invalid
      : errorMessage === 'failed'
        ? text.errors.failed
        : errorMessage

  const markGlyph = (brand.trim().charAt(0) || 'L').toUpperCase()

  return (
    <div className={styles.page}>
      <div className={styles.stage}>
        <section className={styles.intro} aria-labelledby="login-title">
          <div className={styles.mark} aria-hidden="true">
            <span className={styles.markGlyph}>{markGlyph}</span>
          </div>
          <h1 id="login-title" className={styles.title}>
            {text.signInTitle}
          </h1>
          <p className={styles.subtitle}>{text.signInSubtitle}</p>
        </section>

        <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
          <div className={styles.fields}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{text.username}</span>
              <input
                className={styles.input}
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={text.usernamePlaceholder}
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>{text.password}</span>
              <input
                className={styles.input}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={text.passwordPlaceholder}
                required
              />
            </label>
          </div>

          {displayError ? <p className={styles.error}>{displayError}</p> : null}

          <p className={styles.privacyNote}>
            {text.privacyNote} <span className={styles.linkish}>{text.learnMore}</span>
          </p>

          <div className={styles.actions}>
            <button className={`${styles.next} glass-lens`} type="submit" disabled={submitting}>
              {submitting ? text.signingIn : text.next}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
