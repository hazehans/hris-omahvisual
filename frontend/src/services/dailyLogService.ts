// src/services/dailyLogService.ts
import { apiRequest, getAccessToken } from './api'
import type { DailyLog, DailyLogCreatePayload } from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export const dailyLogService = {
  /**
   * GET /api/v1/daily-logs/
   * HR: all logs for date. Employee: own logs for date.
   * date: 'YYYY-MM-DD' | 'ALL' (default: today)
   */
  list(date?: string): Promise<DailyLog[]> {
    const query = date ? `?date=${date}` : ''
    return apiRequest<DailyLog[]>(`/daily-logs/${query}`)
  },

  /**
   * POST /api/v1/daily-logs/
   * Employee only. Supports image upload via FormData.
   */
  async create(payload: DailyLogCreatePayload): Promise<DailyLog> {
    // Jika ada image, gunakan FormData; jika tidak, kirim JSON biasa
    if (payload.image) {
      const formData = new FormData()
      formData.append('activity', payload.activity)
      if (payload.work_link) formData.append('work_link', payload.work_link)
      if (payload.issue) formData.append('issue', payload.issue)
      formData.append('image', payload.image)

      const token = getAccessToken()
      const res = await fetch(`${BASE_URL}/daily-logs/`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      return res.json() as Promise<DailyLog>
    }

    return apiRequest<DailyLog>('/daily-logs/', {
      method: 'POST',
      body: payload as unknown as Record<string, unknown>,
    })
  },
}
