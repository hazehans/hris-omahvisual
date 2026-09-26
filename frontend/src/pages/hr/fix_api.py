import os

with open('HRAttendancePage.tsx', encoding='utf-8') as f:
    code = f.read()

# Fix import
code = code.replace(
    "import api from '@/lib/api'",
    "import { apiRequest } from '@/services/api'"
)

# Fix fetch device method
code = code.replace(
    "const res = await api.post('/attendance/fetch/')\n      setFetchMessage(`Berhasil menarik ${res.data.total_fetched} log mesin.`)",
    "const res = await apiRequest<any>('/attendance/fetch/', { method: 'POST' })\n      setFetchMessage(`Berhasil menarik ${res.total_fetched} log mesin.`)"
)

with open('HRAttendancePage.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

with open('HRRawLogsPage.tsx', encoding='utf-8') as f:
    raw_code = f.read()

# Fix import in HRRawLogsPage
raw_code = raw_code.replace(
    "import api from '@/lib/api'",
    "import { apiRequest } from '@/services/api'"
)

raw_code = raw_code.replace(
    "const res = await api.get('/attendance/raw-events/')\n      setLogs(res.data)",
    "const res = await apiRequest<RawLog[]>('/attendance/raw-events/')\n      setLogs(res)"
)

with open('HRRawLogsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(raw_code)
