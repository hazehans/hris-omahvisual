import re
with open(r'frontend/src/pages/hr/HREmployeesPage.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

pattern = r'\{isSuperuser && \(\s*<>\s*<button\s*type="button"\s*className={`\$\{styles\.actionLink\} \$\{styles\.actionLinkSuccess\}`}\s*onClick=\{\(\) => openConfirmToggle\(\'activate\'\)\}\s*>\s*.*?Aktifkan\s*</button>\s*<button\s*type="button"\s*className={`\$\{styles\.actionLink\} \$\{styles\.actionLinkDanger\}`}\s*onClick=\{\(\) => openConfirmToggle\(\'delete\'\)\}\s*>\s*.*?Hapus Permanen\s*</button>\s*</>\s*\)}'

replacement = '''<button
                          type="button"
                          className={`${styles.actionLink} ${styles.actionLinkSuccess}`}
                          onClick={() => openConfirmToggle('activate')}
                        >
                          ✓ Aktifkan
                        </button>
                        {isSuperuser && (
                          <button
                            type="button"
                            className={`${styles.actionLink} ${styles.actionLinkDanger}`}
                            onClick={() => openConfirmToggle('delete')}
                          >
                            🗑 Hapus Permanen
                          </button>
                        )}'''

c = re.sub(pattern, replacement, c, flags=re.DOTALL)
with open(r'frontend/src/pages/hr/HREmployeesPage.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
