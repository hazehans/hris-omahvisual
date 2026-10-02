import { apiRequest } from './api';
import type { SuperuserDashboardData, AttendanceTodaySummary, AttendanceRecord, HikvisionRawEvent, RawEventListResponse, DeviceInfo, DeviceUser, DeviceCard } from '../types';

export const attendanceService = {
  today: (date?: string) => 
    apiRequest<AttendanceTodaySummary[]>(`/attendance/today/${date ? `?date=${date}` : ''}`),
  
  fetch: (date?: string) =>
    apiRequest<Record<string, unknown>>('/attendance/fetch/', { method: 'POST', body: date ? { date } : {} }),
    
  autoSync: () => 
    apiRequest<Record<string, unknown>>('/attendance/auto-sync/'),
    
  exportPdf: async (date: string): Promise<Response> => {
    const { getAccessToken, getRefreshToken, setTokens, API_BASE } = await import('./api');

    const doFetch = (token: string | null) =>
      fetch(`${API_BASE}/attendance/export-pdf/?date=${date}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

    let token = getAccessToken();
    let response = await doFetch(token);

    // Token expired → try refresh once
    if (response.status === 401) {
      const refresh = getRefreshToken();
      if (refresh) {
        const refreshRes = await fetch(`${API_BASE}/auth/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
        if (refreshRes.ok) {
          const raw = await refreshRes.json();
          const newAccess = raw.access ?? raw.data?.access;
          const newRefresh = raw.refresh ?? raw.data?.refresh ?? refresh;
          if (newAccess) {
            setTokens(newAccess, newRefresh);
            response = await doFetch(newAccess);
          }
        }
      }
    }

    return response;
  },
  
  history: (params?: { employee_id?: number; start?: string; end?: string; type?: string }) => {
    const qs = new URLSearchParams();
    if (params?.employee_id) qs.set('employee_id', String(params.employee_id));
    if (params?.start) qs.set('start', params.start);
    if (params?.end) qs.set('end', params.end);
    if (params?.type) qs.set('type', params.type);
    const query = qs.toString();
    return apiRequest<AttendanceRecord[]>(`/attendance/history/${query ? `?${query}` : ''}`);
  },
  
  analytics: (month?: number, year?: number) =>
    apiRequest<Record<string, unknown>>(`/attendance/analytics/?month=${month ?? new Date().getMonth() + 1}&year=${year ?? new Date().getFullYear()}`),
  
  rawEvents: async (params?: { date?: string; employee_no?: string; major?: string; minor?: string; attendance_status?: string; verify_mode?: string; category?: string }): Promise<HikvisionRawEvent[]> => {
    const qs = new URLSearchParams();
    if (params?.date) qs.set('date', params.date);
    if (params?.employee_no) qs.set('employee_no', params.employee_no);
    if (params?.major) qs.set('major', params.major);
    if (params?.minor) qs.set('minor', params.minor);
    if (params?.attendance_status) qs.set('attendance_status', params.attendance_status);
    if (params?.verify_mode) qs.set('verify_mode', params.verify_mode);
    if (params?.category) qs.set('category', params.category);
    const query = qs.toString();
    // Backend now returns { count, results: [] } instead of a bare array
    const res = await apiRequest<RawEventListResponse>(`/attendance/raw-events/${query ? `?${query}` : ''}`);
    return res.results ?? [];
  },
  
  // Device management
  deviceInfo: () => apiRequest<DeviceInfo>('/attendance/device-info/'),
  deviceUsers: () => apiRequest<{ UserInfo: DeviceUser[] }>('/attendance/device-users/'),
  devicePushUser: (employeeId: number | string) => 
    apiRequest('/attendance/device-push-user/', { method: 'POST', body: { employee_id: employeeId } }),
  deviceDeleteUser: (employeeNo: string) => 
    apiRequest('/attendance/device-delete-user/', { method: 'POST', body: { employee_no: employeeNo } }),
  deviceCards: () => apiRequest<{ CardInfo: DeviceCard[] }>('/attendance/device-cards/'),
  deviceBindCard: (employeeNo: string, cardNo: string) => 
    apiRequest('/attendance/device-bind-card/', { method: 'POST', body: { employee_no: employeeNo, card_no: cardNo } }),
  deviceUnbindCard: (cardNo: string) => 
    apiRequest('/attendance/device-unbind-card/', { method: 'POST', body: { card_no: cardNo } }),
};

export async function getSuperuserDashboard(): Promise<SuperuserDashboardData> {
  const res = await apiRequest<SuperuserDashboardData>('/attendance/superuser-dashboard/')
  return res
}

