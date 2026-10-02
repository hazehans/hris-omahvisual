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
  role: 'SUPERUSER' | 'HR' | 'EMPLOYEE' | 'unknown'
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

export interface AttendanceEvent {
  time: string;
  type: 'IN' | 'OUT';
  verification_mode: string;
}

export interface AttendanceTodaySummary {
  employee_id: number;
  employee_name: string;
  employee_nik: string;
  date: string;
  first_in: string | null;
  last_out: string | null;
  total_events: number;
  is_late: boolean;
  events: AttendanceEvent[];
}

export interface AttendanceRecord {
  id: number;
  employee: number;
  employee_name: string;
  employee_nik: string;
  hikvision_id: string;
  attendance_date: string;
  event_time: string;
  attendance_type: 'IN' | 'OUT';
  verification_mode: string;
  source: string;
  created_at: string;
}

export interface HikvisionRawEvent {
  id: number;
  device_serial: string;
  serial_no: number;
  event_time: string;
  major: number;
  minor: number;
  employee_no: string;
  name_on_device: string;
  card_no: string;
  card_type: string;
  card_reader_no: number | null;
  door_no: number | null;
  verify_mode: string;
  attendance_status: string;
  attendance_label: string;
  user_type: string;
  raw_payload: Record<string, unknown>;
  fetched_at: string;
  // Fields added by backend annotate_event()
  event_label: string;
  event_category: 'SHOW' | 'DETAIL' | 'HIDE' | 'UNKNOWN';
}

export interface RawEventListResponse {
  count: number;
  results: HikvisionRawEvent[];
}

export interface DeviceInfo {
  status: 'online' | 'offline';
  user_count?: {
    userNumber: number;
    bindFaceUserNumber: number;
    bindFingerprintUserNumber: number;
    bindCardUserNumber: number;
  };
  error?: string;
}

export interface DeviceUser {
  employeeNo: string;
  name: string;
  userType: string;
  Valid: { enable: boolean; beginTime: string; endTime: string };
  doorRight: string;
  gender: string;
  numOfCard: number;
  numOfFP: number;
  numOfFace: number;
}

export interface DeviceCard {
  employeeNo: string;
  cardNo: string;
  cardType: string;
}

export interface AuditLogEntry {
  id: number;
  username: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
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

export type LeaveType = 'IZIN' | 'CUTI' | 'SAKIT' | 'IZIN_TERLAMBAT'
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface LeaveRequest {
  id: string
  employee_name: string
  employee_nik: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  late_until: string | null   // format "HH:MM", khusus IZIN_TERLAMBAT
  reason: string
  attachment: string | null
  signed_attachment: string | null
  status: LeaveStatus
  created_at: string
  urgency_warning: string | null  // H-0 / H-1 warning dari backend
}

export interface LeaveCreatePayload {
  leave_type: LeaveType
  start_date: string
  end_date: string
  late_until?: string   // opsional, khusus IZIN_TERLAMBAT
  reason: string
  attachment?: File
}

export interface LeaveApprovalPayload {
  action: 'APPROVE' | 'REJECT'
  signed_attachment?: File
}
export interface SuperuserDashboardData {
  today_stats: {
    total: number;
    present: number;
    late: number;
    leave: number;
    absent: number;
  };
  recent_logs: {
    time: string;
    name: string;
    type: string;
  }[];
  chart_data: {
    date: string;
    present: number;
    late: number;
  }[];
  trend_pct: number;
  device_info: {
    status: string;
    last_sync: string;
  };
}
