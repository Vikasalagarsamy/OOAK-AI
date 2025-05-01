export interface EmployeeCompany {
  id: number
  employee_id: number
  company_id: number
  branch_id: number
  allocation_percentage: number
  is_primary: boolean
  created_at?: string
  updated_at?: string
  company_name?: string
  branch_name?: string
}
