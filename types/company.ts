export interface Company {
  id: number
  name: string
  registration_number?: string
  tax_id?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  founded_date?: string
  company_code?: string
  created_at?: string
  updated_at?: string
}

export interface Branch {
  id: number
  name: string
  company_id: number
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  phone?: string
  email?: string
  branch_code?: string
  is_remote?: boolean
  status?: string
  created_at?: string
  updated_at?: string
}
