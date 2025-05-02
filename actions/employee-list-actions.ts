"use server"

import { createClient } from "@/lib/supabase/server"

export async function getEmployeesWithAllocations() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("employees")
    .select(`
      *,
      departments(name),
      designations(name),
      branches:home_branch_id(name),
      companies:primary_company_id(name)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching employees:", error)
    throw new Error(`Error fetching employees: ${error.message}`)
  }

  // Transform the data to include the related names
  const transformedData = data.map((employee) => ({
    ...employee,
    department_name: employee.departments?.name || null,
    designation_name: employee.designations?.name || null,
    home_branch_name: employee.branches?.name || null,
    primary_company_name: employee.companies?.name || null,
  }))

  return transformedData
}
