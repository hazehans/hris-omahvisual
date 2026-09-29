import { apiRequest } from './api';
import type { AuditLogEntry } from '../types';

export const auditService = {
  list: (params?: { action?: string; start?: string; end?: string; user?: string; ip?: string; target_type?: string }) => {
    const qs = new URLSearchParams();
    if (params?.action) qs.set('action', params.action);
    if (params?.start) qs.set('start', params.start);
    if (params?.end) qs.set('end', params.end);
    if (params?.user) qs.set('user', params.user);
    if (params?.ip) qs.set('ip', params.ip);
    if (params?.target_type) qs.set('target_type', params.target_type);
    const query = qs.toString();
    return apiRequest<AuditLogEntry[]>(`/audit/${query ? `?${query}` : ''}`);
  },
};
