import { useState } from 'react'

import type { UiText } from '@/lib/i18n'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GlassInput } from '@/components/ui/Field'
import { GlassSelect } from '@/components/ui/GlassSelect'
import { GlassPanel } from '@/components/ui/GlassPanel'

import styles from './ComponentsPage.module.css'

interface ComponentsPageProps {
  text: UiText['components']
}

export function ComponentsPage({ text }: ComponentsPageProps) {
  const [selectValue, setSelectValue] = useState('a')

  return (
    <div className={styles.stack}>
      <GlassPanel>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{text.title}</h2>
            <p className={styles.subtitle}>{text.subtitle}</p>
          </div>
          <div className={styles.badges}>
            <Badge tone="success" pulse>
              {text.badgeLive}
            </Badge>
            <Badge tone="warn">{text.badgeWarn}</Badge>
            <Badge tone="accent">{text.badgeOk}</Badge>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Buttons</h3>
          <div className={styles.row}>
            <Button variant="primary">{text.primary}</Button>
            <Button variant="secondary">{text.secondary}</Button>
            <Button variant="ghost">{text.ghost}</Button>
            <Button variant="danger">{text.danger}</Button>
            <Button variant="primary" disabled>
              {text.disabled}
            </Button>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Fields</h3>
          <div className={styles.formGrid}>
            <GlassInput label={text.inputLabel} placeholder={text.inputPlaceholder} />
            <GlassSelect
              label={text.selectLabel}
              value={selectValue}
              options={[
                { value: 'a', label: text.selectOptionA },
                { value: 'b', label: text.selectOptionB },
              ]}
              onChange={setSelectValue}
            />
          </div>
        </div>
      </GlassPanel>

      <div className={styles.cardGrid}>
        {[1, 2, 3].map((n) => (
          <GlassPanel key={n} className={`${styles.card} glass-lens`}>
            <div className={styles.cardTop}>
              <h3 className={styles.cardTitle}>
                {text.cardTitle} {n}
              </h3>
              <Badge tone="neutral">UI</Badge>
            </div>
            <p className={styles.cardBody}>{text.cardBody}</p>
            <div className={styles.cardActions}>
              <Button variant="secondary">{text.secondary}</Button>
              <Button variant="primary">{text.primary}</Button>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  )
}
