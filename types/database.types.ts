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
      user_accounts: {
        Row: {
          id: number
          username: string
          email: string | null
          password_hash: string | null
          is_active: boolean
          employee_id: number | null
          role_id: number | null
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          username: string
          email?: string | null
          password_hash?: string | null
          is_active?: boolean
          employee_id?: number | null
          role_id?: number | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          username?: string
          email?: string | null
          password_hash?: string | null
          is_active?: boolean
          employee_id?: number | null
          role_id?: number | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: number
          employee_id: string
          first_name: string
          last_name: string
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          employee_id: string
          first_name: string
          last_name: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          employee_id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: number
          title: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          description?: string | null
          created_at?: string
          updated_at?: string
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