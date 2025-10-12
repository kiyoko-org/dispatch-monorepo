import type { Database } from './supabase/database.types'

// Database types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type EmergencyCall = Database['public']['Tables']['emergency_calls']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

// Stats types
export interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalReports: number
  totalEmergencyCalls: number
  reportsThisMonth: number
  reportsLastMonth: number
  storageUsed: number
  databaseSize: number
}

export interface TenantStats {
  id: string
  name: string
  userCount: number
  reportCount: number
  emergencyCallCount: number
  storageUsed: number
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
}

// Admin types
export interface AdminUser extends Profile {
  permissions: string[]
  lastActive: string
}

// Activity types
export interface SystemActivity {
  id: string
  timestamp: string
  type: 'user_created' | 'user_updated' | 'report_created' | 'emergency_call' | 'system_config'
  description: string
  userId?: string
  userName?: string
}

