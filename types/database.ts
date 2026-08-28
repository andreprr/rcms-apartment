// ============================================================================
// RCMS TypeScript Types - Match with 001_initial_schema.sql
// ============================================================================

// User Roles
export type UserRole = 'ADMIN' | 'RR' | 'ENGINEERING_ADMIN' | 'ENGINEERING' | 'PENGURUS'

// Ticket Status
export type TicketStatus = 'NEW' | 'ASSIGNED' | 'ON_PROGRESS' | 'WAITING_CONFIRMATION' | 'COMPLETED' | 'REWORK' | 'ON_HOLD' | 'CANCELLED'

// Ticket Stage (Engineering Work Stage)
export type TicketStage = 'INSPECTION' | 'DIAGNOSIS' | 'REPAIR' | 'FINISHING'

// Daily Log Action Type
export type DailyLogAction = 'EXTEND' | 'SUBMIT_FINISH'

// Photo Type
export type PhotoType = 'BEFORE' | 'PROGRESS' | 'AFTER' | 'OTHER'

// ============================================================================
// USER TYPES
// ============================================================================
export interface User {
  id: string
  auth_user_id: string
  full_name: string
  division: string
  avatar_url?: string
  username: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserSession {
  id: string
  full_name: string
  division: string
  avatar_url?: string
  role: UserRole
  is_active: boolean
}

// ============================================================================
// TICKET TYPES (Manual Input by RR)
// ============================================================================
export interface Ticket {
  id: string
  ticket_number: string
  ticket_date: string
  daily_sequence: number

  // Manual Input by RR
  unit_code: string
  resident_name: string
  phone_number: string
  problem: string
  description?: string

  // Status & Stage
  status: TicketStatus
  current_stage?: TicketStage

  // Relations
  created_by: string
  current_assignee_id?: string

  // Timestamps
  started_at?: string
  submitted_at?: string
  completed_at?: string

  // Cancellation
  cancelled_at?: string
  cancelled_by?: string
  cancellation_reason?: string

  // Archive
  is_archived: boolean
  archived_at?: string
  archived_by?: string

  created_at: string
  updated_at: string
}

// Lightweight ticket for lists
export interface TicketSummary {
  id: string
  ticket_number: string
  unit_code: string
  resident_name: string
  problem: string
  status: TicketStatus
  current_stage?: TicketStage
  created_at: string
}

// ============================================================================
// TICKET DAILY LOGS (Engineering Progress Tracking)
// ============================================================================
export interface TicketDailyLog {
  id: string
  ticket_id: string
  engineering_id: string
  day_number: number
  work_description: string
  action_type: DailyLogAction
  duration_minutes?: number
  created_at: string

  // Populated relations
  engineering?: User
}

// ============================================================================
// TICKET ATTACHMENTS (Photos)
// ============================================================================
export interface TicketAttachment {
  id: string
  ticket_id: string
  daily_log_id?: string
  uploaded_by: string
  storage_path: string
  file_name: string
  file_type: string
  file_size?: number
  photo_type: PhotoType
  created_at: string
}

// ============================================================================
// TICKET ASSIGNMENTS (Engineering Assignments History)
// ============================================================================
export interface TicketAssignment {
  id: string
  ticket_id: string
  engineering_user_id: string
  assigned_by: string
  assigned_at: string
  unassigned_at?: string
  is_current: boolean
  reason?: string

  // Populated relations
  engineering?: User
  assigned_by_user?: User
}

// ============================================================================
// TICKET CONFIRMATIONS & RATINGS
// ============================================================================
export interface TicketConfirmation {
  id: string
  ticket_id: string
  rating?: number
  comment?: string
  is_visible: boolean
  confirmed_at: string
}

// ============================================================================
// TICKET HISTORY (Audit Trail)
// ============================================================================
export interface TicketHistory {
  id: string
  ticket_id: string
  user_id?: string
  action: string
  old_value?: Record<string, any>
  new_value?: Record<string, any>
  description?: string
  created_at: string

  // Populated relations
  user?: Pick<User, 'full_name' | 'division'>
}

// ============================================================================
// COUNTERS (Daily Sequence)
// ============================================================================
export interface TicketCounter {
  ticket_date: string
  last_sequence: number
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================
export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface StatsResponse {
  total: number
  new: number
  assigned: number
  inProgress: number
  waiting: number
  completed: number
  rework: number
  onHold: number
  cancelled: number
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================
export interface DashboardStats {
  total: number
  new: number
  onProgress: number
  waitingConfirmation: number
  completed: number
  rework: number
  onHold: number
}

export interface TrendData {
  date: string
  total: number
}

export interface CategoryData {
  category: string
  count: number
}

// ============================================================================
// ROLE-BASED NAVIGATION
// ============================================================================
export interface NavItem {
  name: string
  href: string
  icon: string
  badge?: number
}

export interface RoleNavigation {
  role: UserRole
  items: NavItem[]
}

// Navigation config per role
export const ROLE_NAVIGATION: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { name: 'Dashboard Hub', href: '/admin', icon: 'LayoutDashboard' },
    { name: 'User Management', href: '/admin/users', icon: 'Users' },
    { name: 'Ticket Control', href: '/admin/tickets', icon: 'Ticket' },
    { name: 'Analytics Global', href: '/admin/analytics', icon: 'BarChart3' },
    { name: 'Moderasi Rating', href: '/admin/rating-moderation', icon: 'Star' },
  ],
  RR: [
    { name: 'Dashboard', href: '/rr/dashboard', icon: 'LayoutDashboard' },
    { name: 'Task', href: '/rr/task', icon: 'ClipboardList' },
    { name: 'Ticket Maker', href: '/rr/ticket-maker', icon: 'PlusCircle' },
    { name: 'Calendar', href: '/rr/calendar', icon: 'Calendar' },
    { name: 'Analytics', href: '/rr/analytics', icon: 'BarChart3' },
    { name: 'Team', href: '/rr/team', icon: 'Users' },
    { name: 'Rating Management', href: '/rr/rating-management', icon: 'Star' },
    { name: 'Database', href: '/rr/database', icon: 'Database' },
  ],
  ENGINEERING_ADMIN: [
    { name: 'Dashboard', href: '/engineering-admin/dashboard', icon: 'LayoutDashboard' },
    { name: 'Task', href: '/engineering-admin/tasks', icon: 'ClipboardList' },
    { name: 'Status Kerja', href: '/engineering-admin/status', icon: 'Activity' },
    { name: 'Calendar', href: '/engineering-admin/calendar', icon: 'Calendar' },
    { name: 'Analytics', href: '/engineering-admin/analytics', icon: 'BarChart3' },
    { name: 'Team', href: '/engineering-admin/team', icon: 'Users' },
    { name: 'History & Export', href: '/engineering-admin/history', icon: 'FileText' },
  ],
  ENGINEERING: [
    { name: 'Dashboard', href: '/engineering', icon: 'LayoutDashboard' },
    { name: 'Task', href: '/engineering/task', icon: 'ClipboardList' },
    { name: 'Performance', href: '/engineering/performance', icon: 'BarChart3' },
  ],
  PENGURUS: [
    { name: 'Dashboard', href: '/pengurus', icon: 'LayoutDashboard' },
    { name: 'Analytics', href: '/pengurus/analytics', icon: 'BarChart3' },
    { name: 'Rating Management', href: '/pengurus/rating-management', icon: 'Star' },
  ],
}
