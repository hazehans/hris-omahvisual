// src/services/leaveService.ts
import { apiRequest, API_BASE } from './api'
import type { LeaveRequest, LeaveCreatePayload } from '@/types'

export const leaveService = {
  /**
   * GET /api/v1/leave/
   * HR: ?status=PENDING | ?status=ALL_HISTORY
   * Employee: returns own requests (status param ignored)
   */
  list(statusFilter?: 'PENDING' | 'ALL_HISTORY'): Promise<LeaveRequest[]> {
    const query = statusFilter ? `?status=${statusFilter}` : ''
    return apiRequest<LeaveRequest[]>(`/leave/${query}`)
  },

  /**
   * POST /api/v1/leave/
   * Employee only. Multipart form (attachment optional).
   */
  create(payload: LeaveCreatePayload): Promise<{ message: string }> {
    const form = new FormData()
    form.append('leave_type', payload.leave_type)
    form.append('start_date', payload.start_date)
    form.append('end_date', payload.end_date)
    form.append('reason', payload.reason)
    if (payload.attachment) {
      form.append('attachment', payload.attachment)
    }
    return apiRequest<{ message: string }>('/leave/', {
      method: 'POST',
      body: form,
    })
  },

  /**
   * POST /api/v1/leave/<uuid>/approve/
   * HR only. action: 'APPROVE' | 'REJECT'. signed_attachment optional.
   */
  approve(id: string, action: 'APPROVE' | 'REJECT', signedFile?: File): Promise<{ message: string }> {
    const form = new FormData()
    form.append('action', action)
    if (signedFile) {
      form.append('signed_attachment', signedFile)
    }
    return apiRequest<{ message: string }>(`/leave/${id}/approve/`, {
      method: 'POST',
      body: form,
    })
  },

  /** Build absolute URL for attachment (served by Django media) */
  getAttachmentUrl(relativePath: string): string {
    // relativePath from backend: e.g. "/media/leave_attachments/file.pdf"
    return `${API_BASE.replace('/api/v1', '')}${relativePath}`
  },
}
