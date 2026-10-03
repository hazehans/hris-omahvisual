with open(r'frontend/src/pages/employee/EmployeeLeavePage.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

t = '''              <label className={styles.label}>
                Sampai Tanggal *
                <input 
                  required 
                  type="date"
                  className={styles.input} 
                  value={form.end_date} 
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                />
              </label>'''

r = '''              {form.leave_type !== 'IZIN_TERLAMBAT' && (
                <label className={styles.label}>
                  Sampai Tanggal *
                  <input 
                    required 
                    type="date"
                    className={styles.input} 
                    value={form.end_date} 
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  />
                </label>
              )}'''

c = c.replace(t, r)

with open(r'frontend/src/pages/employee/EmployeeLeavePage.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
