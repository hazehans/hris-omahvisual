import os

with open('HRLayout.tsx', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    "type HRPageId = 'dashboard' | 'attendance' | 'employees' | 'daily-log' | 'leave'",
    "type HRPageId = 'dashboard' | 'attendance' | 'raw-logs' | 'employees' | 'daily-log' | 'leave'"
)

code = code.replace(
    "{ id: 'attendance', label: 'Live Absensi', description: 'Pantau kehadiran hari ini',        icon: '◈' },",
    "{ id: 'attendance', label: 'Live Absensi', description: 'Pantau kehadiran hari ini',        icon: '◈' },\n  { id: 'raw-logs',   label: 'Raw Event Log',description: 'Pantau log mentah mesin',          icon: '▧' },"
)

code = code.replace(
    "attendance: 'attendance',",
    "attendance: 'attendance',\n  'raw-logs': 'raw-logs',"
)

with open('HRLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
