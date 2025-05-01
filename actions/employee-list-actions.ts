"use server"

import { createClient } from "@/lib/supabase/server"
import type { Employee } from "@/types/employee"

export async function getEmployeesWithAllocations(): Promise<Employee[]> {
  const supabase = createClient()

  try {
    // First get all employees with their basic information
    const { data: employees, error } = await supabase
      .from("employees")
      .select(`
        *,
        departments(name),
        designations(name),
        branches:home_branch_id(name),
        companies:primary_company_id(name)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Get all employee company allocations
    const { data: allocations, error: allocationsError } = await supabase.from("employee_companies").select(`
        *,
        companies:company_id(name),
        branches:branch_id(name)
      `)

    if (allocationsError) throw allocationsError

    // Map allocations to employees
    const employeesWithAllocations = employees.map((employee) => {
      const employeeAllocations = allocations.filter((a) => a.employee_id === employee.id)

      return {
        ...employee,
        department_name: employee.departments?.name || null,
        designation_name: employee.designations?.name || null,
        home_branch_name: employee.branches?.name || null,
        primary_company_name: employee.companies?.name || null,
        allocations: employeeAllocations.map((a) => ({
          id: a.id,
          company_id: a.company_id,
          company_name: a.companies?.name || null,
          branch_id: a.branch_id,
          branch_name: a.branches?.name || null,
          allocation_percentage: a.allocation_percentage,
          is_primary: a.is_primary,
        })),
      }
    })

    return employeesWithAllocations
  } catch (error) {
    console.error("Error fetching employees with allocations:", error)
    throw error
  }
}
