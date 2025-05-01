export interface Employee {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  hire_date?: string
  termination_date?: string
  job_title?: string
  department_id?: number
  designation_id?: number
  primary_company_id?: number
  home_branch_id?: number
  status: string
  created_at?: string
  updated_at?: string

  // Joined fields
  department?: string
  primary_company?: string

  // For display purposes
  departments?: { name: string }
  companies?: { name: string }
}

export interface Department {
  id: number
  name: string
  description: string | null
  manager_id: number | null
  parent_department_id: number | null
  created_at: string
  updated_at: string
}

export interface Designation {
  id: number
  name: string
  department_id: number | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: number
  name: string
  registration_number: string | null
  tax_id: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  founded_date: string | null
  created_at: string
  updated_at: string
  company_code: string | null
}

export interface Branch {
  id: number
  company_id: number
  name: string
  address: string | null
  phone: string | null
  email: string | null
  manager_id: number | null
  is_remote: boolean
  created_at: string
  updated_at: string
  branch_code: string | null
  location: string | null
}

export interface EmployeeCompany {
  id: number
  employee_id: number
  company_id: number
  branch_id: number
  allocation_percentage: number
  is_primary: boolean
  created_at: string
  updated_at: string

  // Joined fields
  company_name?: string | null
  branch_name?: string | null
}

export interface EmployeeFormData {
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
}

export interface EmployeeCompanyFormData {
  company_id: number
  branch_id: number
  allocation_percentage: number
  is_primary: boolean
}
