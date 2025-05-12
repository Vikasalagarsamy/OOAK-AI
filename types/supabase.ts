export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      branches: {
        Row: {
          id: number
          name: string
          location: string
          company_id: number
          created_at: string
          updated_at: string
          is_active: boolean
          code: string
        }
        Insert: {
          id?: number
          name: string
          location: string
          company_id: number
          created_at?: string
          updated_at?: string
          is_active?: boolean
          code?: string
        }
        Update: {
          id?: number
          name?: string
          location?: string
          company_id?: number
          created_at?: string
          updated_at?: string
          is_active?: boolean
          code?: string
        }
      }
      companies: {
        Row: {
          id: number
          name: string
          created_at: string
          updated_at: string
          is_active: boolean
          code: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          code?: string
        }
        Update: {
          id?: number
          name?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          code?: string
        }
      }
      employees: {
        Row: {
          id: number
          first_name: string
          last_name: string
          email: string
          phone: string
          department_id: number
          designation_id: number
          branch_id: number
          created_at: string
          updated_at: string
          is_active: boolean
          employee_id: string
          location: string
        }
        Insert: {
          id?: number
          first_name: string
          last_name: string
          email: string
          phone: string
          department_id: number
          designation_id: number
          branch_id: number
          created_at?: string
          updated_at?: string
          is_active?: boolean
          employee_id?: string
          location?: string
        }
        Update: {
          id?: number
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          department_id?: number
          designation_id?: number
          branch_id?: number
          created_at?: string
          updated_at?: string
          is_active?: boolean
          employee_id?: string
          location?: string
        }
      }
      // Add other tables as needed
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
