# HRIS OmahVisual — Revision & Improvement TODO

**Last Updated:** 2026-09-29
**Status Legend:** Done | In Progress | Pending | Blocked

---

## Progress Summary

| # | Feature | Backend | Frontend | Status |
|---|---------|---------|----------|--------|
| 1 | Auto Sync Attendance | Done | Done | Done |
| 2 | Fix Global Refresh | Done | Done | Done |
| 3 | Leave HR Visibility | Done | Done | Done |
| 4 | Daily Log HR Access | Done | — | Done |
| 5 | Raw Event Filtering | Done | Done | Done |
| 6 | Employee Filtering | — | Done | Done |
| 7 | Audit Log Filter | Done | Done | Done |
| 8 | Dashboard Improvement | — | Done | Done |
| 9 | Device Sync Status | — | Done | Done |
| 10 | Push Confirmation | — | Done | Done |
| 11 | PDF Export | Done | Done | Done |

---

## 1. Automatic Attendance Event Synchronization
Goal: Auto-poll Hikvision device every 5 seconds; update Raw Event Log & Live Absensi (HR + Superuser).

- [x] Backend: Add /attendance/auto-sync/ endpoint (GET, lightweight)
- [x] Frontend: Polling every 5s in HRAttendancePage & HRRawLogsPage
- [x] Deduplication via get_or_create (serial_no unique)
- [x] Error handling: graceful degradation, show sync status in UI
- [x] Sync status indicator in UI

## 2. Fix Global Refresh Functionality
Goal: All refresh buttons fetch fresh data from API/DB.

- [x] HRAttendancePage: Fix fetchData callback deps (targetDate)
- [x] HRRawLogsPage: Fix refresh button
- [x] AuditLogPage: Make search/filter trigger re-fetch
- [x] No duplicate data on refresh
- [x] Loading state consistency

## 3. Leave Request – HR Visibility Fix
Goal: Leave requests visible to HR role (not just Superuser).

- [x] Backend: LeaveRequestAPIView.get() — add HR role check (is_staff)
- [x] Backend: LeaveApprovalAPIView — allow HR to approve/reject
- [x] Employee can see only own leaves — preserved

## 4. Daily Log Visibility – HR Access
Goal: HR can see daily logs from employees in their scope.

- [x] Backend DailyLogListCreateAPIView: Add HR role — return all employee logs
- [x] Employee still only sees own logs
- [x] Superuser sees all (already working)

## 5. Raw Event Log – Filtering
Goal: Add comprehensive filters to Raw Event Log table.

- [x] Backend RawEventListView: Add filters: major, minor, verify_mode, attendance_status, start_date, end_date, user_type
- [x] Frontend HRRawLogsPage: Add filter UI: date range, employee_no, major/minor, attendance_status
- [x] Reset Filter button
- [x] Pagination compatible with filters

## 6. Employee Table – Filtering & Search
Goal: Add search and multi-filter on employee table.

- [x] HREmployeesPage: Search by name/NIK
- [x] Filter by: role, status (active/inactive), contract_type
- [x] Reset filter button
- [x] Compatible with pagination

## 7. Superuser – Audit Log Search & Filter
Goal: Fix search and add proper filters on Audit Log page.

- [x] Backend AuditLogView: Add filters: user, action, ip, start, end, target_type
- [x] Frontend AuditLogPage: Fix search (connect to API filters)
- [x] Add filter UI: user, action, date range, IP, target_type
- [x] Reset filter button
- [x] Pagination works after filter

## 8. Dashboard Improvement
Goal: Cleaner, more professional dashboards with relevant filters.

- [x] HRDashboardPage: Improve layout and date filter
- [x] SuperuserDashboardPage: Add refresh + sync status
- [x] Filters affect all relevant stats

## 9. Integrasi Perangkat – Status Sync UI
Goal: Show accurate sync status per employee.

- [x] DeviceManagementPage: Improve sync status labels
- [x] Status reflects real data (compare HRIS vs device user list)
- [x] Improve device status section

## 10. Confirmation Before Push User to Device
Goal: Show confirmation modal before pushing to Hikvision.

- [x] DeviceManagementPage: Replace alert() with confirmation modal
- [x] Modal shows: employee name, hikvision_id, device info
- [x] Cancel = no request sent
- [x] After push: show success/error state inline
- [x] Auto-update sync status after successful push

## 11. Attendance Report – PDF Export
Goal: HR and Superuser can download PDF attendance report with active filters.

- [x] Backend: Check reportlab availability
- [x] Backend: Add /attendance/export-pdf/ endpoint (HR + Superuser only)
- [x] PDF: header, attendance table, summary
- [x] Respect active filters (date range, employee)
- [x] HR scope enforced server-side
- [x] Frontend: Download PDF button with loading state
- [x] File naming: Laporan_Absensi_YYYY-MM-DD_YYYY-MM-DD.pdf
- [x] Error if no data

---

## Implementation Notes

### Role Detection (Backend)
- user.is_superuser = Superuser
- user.is_staff and not user.is_superuser = HR
- Otherwise = Employee

### Key Files Modified
- backend/attendance/views.py — auto-sync, pdf-export, raw event filters
- backend/leave/views.py — HR visibility
- backend/daily_report/views.py — HR visibility
- backend/audit/views.py — improved filters
- frontend/src/pages/hr/HRAttendancePage.tsx — auto-sync, PDF button
- frontend/src/pages/hr/HRRawLogsPage.tsx — filters, auto-sync
- frontend/src/pages/hr/HREmployeesPage.tsx — enhanced filters
- frontend/src/pages/admin/AuditLogPage.tsx — enhanced filters
- frontend/src/pages/admin/DeviceManagementPage.tsx — confirmation modal, sync status
