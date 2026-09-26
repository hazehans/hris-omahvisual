import os

with open('HRAttendancePage.tsx', encoding='utf-8') as f:
    code = f.read()

# Add import for api
if "import api from '@/lib/api'" not in code:
    code = code.replace(
        "import { attendanceService } from '@/services/attendanceService'",
        "import { attendanceService } from '@/services/attendanceService'\nimport api from '@/lib/api'"
    )

# Add fetchFromDevice function
fetch_func = """
  const [fetchingDevice, setFetchingDevice] = useState(false)
  const [fetchMessage, setFetchMessage] = useState('')

  const handleFetchDevice = async () => {
    setFetchingDevice(true)
    setFetchMessage('')
    try {
      const res = await api.post('/attendance/fetch/')
      setFetchMessage(`Berhasil menarik ${res.data.total_fetched} log mesin.`)
      void fetchData(true)
    } catch (err: any) {
      setFetchMessage(err.message || 'Gagal menarik data dari mesin.')
    } finally {
      setFetchingDevice(false)
    }
  }
"""

if "handleFetchDevice" not in code:
    code = code.replace(
        "const [lastUpdated, setLastUpdated] = useState<Date | null>(null)",
        "const [lastUpdated, setLastUpdated] = useState<Date | null>(null)\n" + fetch_func
    )

# Add the button
btn_ui = """
            {fetchMessage && <span style={{ fontSize: '0.75rem', color: '#10b981' }}>{fetchMessage}</span>}
            <Button
              variant="primary"
              onClick={handleFetchDevice}
              disabled={fetchingDevice}
            >
              {fetchingDevice ? 'Sedang Menarik...' : '🔄 Tarik Data Mesin'}
            </Button>
"""

if "Tarik Data Mesin" not in code:
    code = code.replace(
        "onClick={() => void fetchData(true)}",
        "onClick={() => void fetchData(true)}"
    )
    code = code.replace(
        "<Button\n              variant=\"ghost\"",
        btn_ui + "\n            <Button\n              variant=\"ghost\""
    )

with open('HRAttendancePage.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
