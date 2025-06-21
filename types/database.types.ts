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
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          country: string | null
          hire_date: string | null
          termination_date: string | null
          status: string
          department_id: number | null
          designation_id: number | null
          job_title: string | null
          home_branch_id: number | null
          primary_company_id: number | null
          name: string | null
          username: string | null
          password_hash: string | null
          role_id: number | null
          last_login: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          employee_id: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          hire_date?: string | null
          termination_date?: string | null
          status?: string
          department_id?: number | null
          designation_id?: number | null
          job_title?: string | null
          home_branch_id?: number | null
          primary_company_id?: number | null
          name?: string | null
          username?: string | null
          password_hash?: string | null
          role_id?: number | null
          last_login?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          employee_id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          hire_date?: string | null
          termination_date?: string | null
          status?: string
          department_id?: number | null
          designation_id?: number | null
          job_title?: string | null
          home_branch_id?: number | null
          primary_company_id?: number | null
          name?: string | null
          username?: string | null
          password_hash?: string | null
          role_id?: number | null
          last_login?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: number
          title: string | null
          description: string | null
          department_id: number | null
          responsibilities: string[] | null
          required_skills: string[] | null
          is_management: boolean
          is_system_role: boolean
          is_admin: boolean
          name: string
          permissions: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title?: string | null
          description?: string | null
          department_id?: number | null
          responsibilities?: string[] | null
          required_skills?: string[] | null
          is_management?: boolean
          is_system_role?: boolean
          is_admin?: boolean
          name: string
          permissions?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string | null
          description?: string | null
          department_id?: number | null
          responsibilities?: string[] | null
          required_skills?: string[] | null
          is_management?: boolean
          is_system_role?: boolean
          is_admin?: boolean
          name?: string
          permissions?: Json | null
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