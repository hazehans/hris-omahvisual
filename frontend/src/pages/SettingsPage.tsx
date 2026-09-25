import { useState, type ChangeEvent, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { GlassInput } from '@/components/ui/Field'
import { GlassSelect } from '@/components/ui/GlassSelect'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { LANGUAGE_LABELS, LANGUAGES, type Language, type UiText } from '@/lib/i18n'
import { writeStoredBrand } from '@/lib/storage'

import styles from './SettingsPage.module.css'

interface SettingsPageProps {
  text: UiText['settings']
  language: Language
  brand: string
  onBrandChange: (brand: string) => void
  onLanguageChange: (language: Language) => void
}

const LANGUAGE_OPTIONS = LANGUAGES.map((option) => ({
  value: option,
  label: LANGUAGE_LABELS[option],
}))

export function SettingsPage({
  text,
  language,
  brand,
  onBrandChange,
  onLanguageChange,
}: SettingsPageProps) {
  const [draftBrand, setDraftBrand] = useState(brand)
  const [saved, setSaved] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const next = draftBrand.trim() || brand
    onBrandChange(next)
    writeStoredBrand(next)
    setSaved(true)
  }

  function handleBrandChange(event: ChangeEvent<HTMLInputElement>): void {
    setDraftBrand(event.target.value)
    setSaved(false)
  }

  return (
    <GlassPanel>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{text.title}</h2>
          <p className={styles.subtitle}>{text.subtitle}</p>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <GlassInput
          label={text.brandLabel}
          value={draftBrand}
          placeholder={text.brandPlaceholder}
          onChange={handleBrandChange}
        />

        <GlassSelect
          label={text.languageLabel}
          value={language}
          options={LANGUAGE_OPTIONS}
          onChange={(next) => onLanguageChange(next as Language)}
        />

        <div className={styles.actions}>
          <Button type="submit" variant="primary">
            {text.save}
          </Button>
          {saved ? <p className={styles.saved}>{text.saved}</p> : null}
        </div>

        <p className={styles.hint}>{text.hint}</p>
      </form>
    </GlassPanel>
  )
}
