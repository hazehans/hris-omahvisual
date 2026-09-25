// src/types/index.ts
// TypeScript interfaces derived from backend API response schemas.
// Field names match backend exactly (snake_case).

// ===== AUTH =====

export interface LoginPayload {
  username: string
  password: string
  device_id: string
}

export interface UserInfo {
  role: 'admin' | 'employee' | 'unknown'
  name: string
  nik: string
  position?: string
  employee_id?: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: UserInfo
}

// ===== API WRAPPER =====

export interface ApiSuccess<T> {
  status: 'success'
  data: T
}

export interface ApiError {
  status: 'error'
  code: string
  message: string
  errors?: Record<string, string[]>
}

// ===== EMPLOYEE =====

export type Gender = 'LAKI_LAKI' | 'PEREMPUAN'
export type ContractType = 'PKWT' | 'PKWTT' | 'FREELANCE' | 'INTERN'

export interface Employee {
  id: string
  user: string | null
  nik: string
  full_name: string
  nickname: string | null
  hikvision_id: string | null
  whatsapp_number: string
  emergency_contact: string | null
  gender: Gender
  religion: string | null
  address: string | null
  role: string
  birth_place: string | null
  birth_date: string | null
  join_date: string
  contract_type: ContractType
  contract_end_date: string | null
  bank_account_info: string | null
  is_active: boolean
}

// ===== ATTENDANCE =====

export interface AttendanceTodayItem {
  name: string
  nik: string
  clock_in: string  // "HH:MM:SS" or "-"
  clock_out: string  // "HH:MM:SS" or "-"
  is_late: boolean
  kpi_score: number | 'Belum Dihitung'
}

// ===== DAILY LOG =====

export interface DailyLog {
  id: number
  employee_name: string
  employee_role: string
  date: string
  activity: string
  work_link: string | null
  issue: string | null
  created_at: string
}

export interface DailyLogCreatePayload {
  activity: string
  work_link?: string
  issue?: string
}

// ===== LEAVE / CUTI =====

export type LeaveType = 'IZIN' | 'CUTI' | 'SAKIT'
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_REJECTED'

export interface LeaveRequest {
  id: string
  employee_name: string
  employee_nik: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason: string
  attachment: string | null
  signed_attachment: string | null
  status: LeaveStatus
  created_at: string
}

export interface LeaveCreatePayload {
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason: string
  attachment?: File
}

export interface LeaveApprovalPayload {
  action: 'APPROVE' | 'REJECT'
  signed_attachment?: File
}
