export interface EmployeeCompany {
  id: number
  employee_id: number
  company_id: number
  company_name?: string
  branch_id: number
  branch_name?: string
  allocation_percentage: number
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface EmployeeCompanyFormData {
  company_id: number
  branch_id: number
  allocation_percentage: number
  is_primary: boolean
}
