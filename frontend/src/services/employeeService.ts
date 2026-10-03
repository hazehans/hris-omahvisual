// src/services/employeeService.ts
import { apiRequest, getAccessToken, API_BASE } from './api'
import type { Employee } from '@/types'

export const employeeService = {
  /** GET /api/v1/employees/ */
  list(): Promise<Employee[]> {
    return apiRequest<Employee[]>('/employees/')
  },

  /** GET /api/v1/employees/<uuid>/ */
  get(id: string): Promise<Employee> {
    return apiRequest<Employee>(`/employees/${id}/`)
  },

  /** POST /api/v1/employees/ */
  create(data: Partial<Employee>): Promise<Employee> {
    return apiRequest<Employee>('/employees/', {
      method: 'POST',
      body: data as Record<string, unknown>,
    })
  },

  /** PATCH /api/v1/employees/<uuid>/ */
  update(id: string, data: Partial<Employee>): Promise<Employee> {
    return apiRequest<Employee>(`/employees/${id}/`, {
      method: 'PATCH',
      body: data as Record<string, unknown>,
    })
  },

  /**
   * DELETE /api/v1/employees/<id>/
   * - SUPERADMIN: hard delete (dari DB + Hikvision)
   * - HR: soft deactivate (is_active = false)
   */
  delete(id: number): Promise<void> {
    return apiRequest<void>(`/employees/${id}/`, { method: 'DELETE' })
  },

  /** @deprecated Gunakan delete() yang sudah role-aware */
  deactivate(id: string): Promise<void> {
    return apiRequest<void>(`/employees/${id}/`, { method: 'DELETE' })
  },

  /**
   * PATCH /api/v1/employees/<id>/toggle-active/
   * Hanya Superadmin. { is_active: true | false }
   */
  toggleActive(id: number, isActive: boolean): Promise<{ message: string; is_active: boolean }> {
    return apiRequest<{ message: string; is_active: boolean }>(`/employees/${id}/toggle-active/`, {
      method: 'PATCH',
      body: { is_active: isActive },
    })
  },

  /**
   * PATCH /api/v1/employees/<id>/photo/
   * Upload foto karyawan. HR/Superadmin only.
   */
  async uploadPhoto(id: number, photoFile: File): Promise<{ message: string; photo_url: string }> {
    const formData = new FormData()
    formData.append('photo', photoFile)

    const token = getAccessToken()
    const res = await fetch(`${API_BASE}/employees/${id}/photo/`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
    }
    return res.json() as Promise<{ message: string; photo_url: string }>
  },

  /** POST /api/v1/employees/<id>/reset-password/ */
  resetPassword(id: string, newPassword?: string): Promise<{ message: string; username: string; password: string }> {
    const body = newPassword ? { new_password: newPassword } : undefined
    return apiRequest<{ message: string; username: string; password: string }>(`/employees/${id}/reset-password/`, {
      method: 'POST',
      body: body as Record<string, unknown>,
    })
  },

  /** GET /api/v1/employees/passwords/ (Superuser only) */
  listPasswords(): Promise<{ employee_id: number; raw_password: string }[]> {
    return apiRequest<{ employee_id: number; raw_password: string }[]>('/employees/passwords/')
  },
}
