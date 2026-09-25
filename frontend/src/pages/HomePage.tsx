import type { UiText } from '@/lib/i18n'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'

import styles from './HomePage.module.css'

interface HomePageProps {
  text: UiText['home']
  onOpenComponents: () => void
  onOpenSettings: () => void
}

export function HomePage({ text, onOpenComponents, onOpenSettings }: HomePageProps) {
  return (
    <div className={styles.stack}>
      <GlassPanel className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <Badge tone="accent" pulse>
            Liquid Glass
          </Badge>
          <h2 className={styles.title}>{text.title}</h2>
          <p className={styles.body}>{text.body}</p>
          <div className={styles.actions}>
            <Button variant="primary" onClick={onOpenComponents}>
              {text.ctaPrimary}
            </Button>
            <Button variant="secondary" onClick={onOpenSettings}>
              {text.ctaSecondary}
            </Button>
          </div>
        </div>
      </GlassPanel>

      <div className={styles.grid}>
        {text.cards.map((card) => (
          <GlassPanel key={card.title} className={`${styles.card} glass-lens`}>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <p className={styles.cardBody}>{card.body}</p>
          </GlassPanel>
        ))}
      </div>
    </div>
  )
}
