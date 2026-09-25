// src/pages/employee/EmployeeAttendancePage.tsx
import { GlassPanel } from '@/components/ui/GlassPanel'

export function EmployeeAttendancePage() {
  return (
    <div style={{ padding: '1rem 0' }}>
      <GlassPanel>
        <h2 style={{ color: 'white', margin: '0 0 1rem 0', fontWeight: 600 }}>Absensi Saya</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, maxWidth: '600px' }}>
          Halaman ini nantinya akan berisi riwayat kehadiran Anda (Jam Masuk, Jam Pulang) serta formasi jadwal kerja.
        </p>
      </GlassPanel>
    </div>
  )
}
