export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          phone_number: string | null
          role: 'user' | 'admin' | 'super_admin'
          status: 'active' | 'inactive' | 'suspended'
          avatar_url: string | null
          last_login: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          phone_number?: string | null
          role?: 'user' | 'admin' | 'super_admin'
          status?: 'active' | 'inactive' | 'suspended'
          avatar_url?: string | null
          last_login?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          phone_number?: string | null
          role?: 'user' | 'admin' | 'super_admin'
          status?: 'active' | 'inactive' | 'suspended'
          avatar_url?: string | null
          last_login?: string | null
        }
      }
      reports: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          incident_title: string
          incident_category: string
          incident_description: string
          incident_date: string
          incident_time: string
          location_address: string
          location_latitude: number | null
          location_longitude: number | null
          status: 'pending' | 'assigned' | 'in-progress' | 'resolved' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'critical'
          assigned_to: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          incident_title: string
          incident_category: string
          incident_description: string
          incident_date: string
          incident_time: string
          location_address: string
          location_latitude?: number | null
          location_longitude?: number | null
          status?: 'pending' | 'assigned' | 'in-progress' | 'resolved' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          assigned_to?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          incident_title?: string
          incident_category?: string
          incident_description?: string
          incident_date?: string
          incident_time?: string
          location_address?: string
          location_latitude?: number | null
          location_longitude?: number | null
          status?: 'pending' | 'assigned' | 'in-progress' | 'resolved' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          assigned_to?: string | null
        }
      }
      emergency_calls: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          caller_id: string
          call_type: string
          status: 'active' | 'ended' | 'cancelled'
          location_latitude: number | null
          location_longitude: number | null
          location_address: string | null
          responder_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          caller_id: string
          call_type: string
          status?: 'active' | 'ended' | 'cancelled'
          location_latitude?: number | null
          location_longitude?: number | null
          location_address?: string | null
          responder_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          caller_id?: string
          call_type?: string
          status?: 'active' | 'ended' | 'cancelled'
          location_latitude?: number | null
          location_longitude?: number | null
          location_address?: string | null
          responder_id?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          created_at: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string | null
          details: Json | null
          ip_address: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          action: string
          resource_type: string
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          action?: string
          resource_type?: string
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

