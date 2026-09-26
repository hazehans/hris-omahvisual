import os

with open('HRRawLogsPage.tsx', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    'import { PageHeader } from "@/components/layout/PageHeader";',
    'import { GlassPanel } from "@/components/ui/GlassPanel";'
)

header_code = """
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Raw Event Log</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Pantau seluruh data mentah dari mesin Hikvision, termasuk yang ditolak/invalid.</p>
      </div>
"""

code = code.replace(
    '<PageHeader title="Raw Event Log" description="Pantau seluruh data mentah dari mesin Hikvision, termasuk yang ditolak/invalid." />',
    header_code
)

with open('HRRawLogsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
