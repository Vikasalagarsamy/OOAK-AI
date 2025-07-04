export interface Employee {
  id: number
  employee_id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  hire_date?: string | Date
  termination_date?: string | Date | null
  job_title?: string
  department_id?: number
  designation_id?: number
  primary_company_id?: number
  home_branch_id?: number
  status?: string
  created_at?: string | Date
  updated_at?: string | Date

  // Nested relations
  departments?: { name: string }
  designations?: { name: string }
  companies?: { name: string }
  branches?: { name: string }

  // Denormalized fields
  department_name?: string
  designation_name?: string
  primary_company_name?: string
  home_branch_name?: string

  // This field might not exist in the database
  location?: string

  // Add any other properties that might be returned
  [key: string]: any
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

export interface Project {
  id: number
  name: string
  code: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: string
  company_id: number | null
  created_at: string
  updated_at: string
}

export interface EmployeeCompany {
  id: number
  employee_id: number
  company_id: number
  branch_id: number
  project_id?: number | null
  allocation_percentage: number
  is_primary: boolean
  start_date?: string | Date | null
  end_date?: string | Date | null
  status?: string
  created_at: string
  updated_at: string

  // Joined fields
  company_name?: string | null
  branch_name?: string | null
  project_name?: string | null
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
  project_id?: number | null
  allocation_percentage: number
  is_primary: boolean
  start_date?: string | null
  end_date?: string | null
}
