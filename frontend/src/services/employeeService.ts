// src/services/employeeService.ts
import { apiRequest } from './api'
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

  /** DELETE /api/v1/employees/<uuid>/ — soft delete (sets is_active=False) */
  deactivate(id: string): Promise<void> {
    return apiRequest<void>(`/employees/${id}/`, { method: 'DELETE' })
  },
}
