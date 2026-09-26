import os

with open('index.tsx', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    "import { HRAttendancePage } from '@/pages/hr/HRAttendancePage'",
    "import { HRAttendancePage } from '@/pages/hr/HRAttendancePage'\nimport { HRRawLogsPage } from '@/pages/hr/HRRawLogsPage'"
)

code = code.replace(
    '<Route path="attendance" element={<HRAttendancePage />} />',
    '<Route path="attendance" element={<HRAttendancePage />} />\n          <Route path="raw-logs" element={<HRRawLogsPage />} />'
)

with open('index.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
