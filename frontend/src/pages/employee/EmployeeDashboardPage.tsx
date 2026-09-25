// src/pages/employee/EmployeeDashboardPage.tsx
import { GlassPanel } from '@/components/ui/GlassPanel'
import { useAuth } from '@/context/AuthContext'

export function EmployeeDashboardPage() {
  const { user } = useAuth()
  
  return (
    <div style={{ padding: '1rem 0' }}>
      <GlassPanel>
        <h2 style={{ color: 'white', margin: '0 0 1rem 0', fontWeight: 600 }}>Selamat Datang, {user?.name}</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, maxWidth: '600px' }}>
          Ini adalah Portal Karyawan OmahVisual. Modul absensi pribadi, riwayat kehadiran, pengisian daily log harian, serta pengajuan izin dan cuti akan dikembangkan dan segera hadir di halaman ini.
        </p>
      </GlassPanel>
    </div>
  )
}
