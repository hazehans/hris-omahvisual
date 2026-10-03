import re

with open(r'frontend/src/pages/hr/HRLeavePage.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

pattern = r'\{l\.urgency_warning && \(\s*<div style=\{\{ fontSize: \'0\.65rem\', color: \'rgba\(255,214,10,0\.8\)\', marginTop: \'0\.2rem\', maxWidth: 120 \}\}>\s*\{l\.urgency_warning\}\s*</div>\s*\)\}'

replacement = '''{l.urgency_warning && (
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                backgroundColor: 'rgba(255, 214, 10, 0.1)',
                                color: '#FFD60A',
                                border: '1px solid rgba(255, 214, 10, 0.3)',
                                borderRadius: '12px',
                                padding: '0.15rem 0.5rem',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                marginTop: '0.35rem',
                                whiteSpace: 'nowrap'
                              }}>
                                🟡 {l.urgency_warning}
                              </div>
                            )}'''

c = re.sub(pattern, replacement, c)

with open(r'frontend/src/pages/hr/HRLeavePage.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
