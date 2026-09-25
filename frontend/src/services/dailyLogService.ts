// src/services/dailyLogService.ts
import { apiRequest } from './api'
import type { DailyLog, DailyLogCreatePayload } from '@/types'

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
   * Employee only.
   */
  create(payload: DailyLogCreatePayload): Promise<DailyLog> {
    return apiRequest<DailyLog>('/daily-logs/', {
      method: 'POST',
      body: payload as unknown as Record<string, unknown>,
    })
  },
}
