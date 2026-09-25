// src/utils/api.js
// DEPRECATED — replaced by src/services/api.ts
// Legacy JSX files import { getDeviceId } from here; we stub it.

export { apiRequest as default, apiRequest, clearTokens, setTokens, getAccessToken, API_BASE } from '../services/api'

export { getOrCreateDeviceId as getDeviceId } from '../services/authService'
