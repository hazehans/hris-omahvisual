// src/services/attendanceService.ts
import { apiRequest } from './api'
import type { AttendanceTodayItem } from '@/types'

export const attendanceService = {
  /**
   * GET /api/v1/attendance/today/
   * Public endpoint — no auth required.
   * Returns live attendance for today.
   */
  today(): Promise<AttendanceTodayItem[]> {
    return apiRequest<AttendanceTodayItem[]>('/attendance/today/', { skipAuth: true })
  },
}
