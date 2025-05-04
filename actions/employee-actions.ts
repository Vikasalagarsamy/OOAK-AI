"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Branch } from "@/types/employee"
import { generateEmployeeId as generateEmployeeIdUtil } from "@/utils/employee-id-generator"

// Define the EmployeeCompany type
export type EmployeeCompany = {
  id: number
  employee_id: string
  company_id: number
  branch_id: number
  company_name: string
  branch_name: string
  allocation_percentage: number
  is_primary: boolean
}

export async function getEmployees() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("employees")
    .select(`
      *,
      departments(name),
      designations(name),
      branches(name),
      companies(name)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching employees:", error)
    throw new Error(`Error fetching employees: ${error.message}`)
  }

  // Transform the data to include the related names
  const transformedData = data.map((employee) => ({
    ...employee,
    department_name: employee.departments?.name || "Not Assigned",
    designation_name: employee.designations?.name || "Not Assigned",
    home_branch_name: employee.branches?.name || "Not Assigned",
    primary_company_name: employee.companies?.name || "Not Assigned",
  }))

  return transformedData
}

export async function getEmployee(id: string | number) {
  const supabase = createClient()

  // Validate that id is a number
  const numericId = typeof id === "string" ? Number.parseInt(id) : id

  if (isNaN(numericId)) {
    throw new Error(`Invalid employee ID: ${id}`)
  }

  const { data, error } = await supabase
    .from("employees")
    .select(`
      *,
      departments(name),
      designations(name),
      branches(name),
      companies(name)
    `)
    .eq("id", numericId)
    .single()

  if (error) {
    console.error("Error fetching employee:", error)
    throw new Error(`Error fetching employee: ${error.message}`)
  }

  // Transform the data to include the related names
  const transformedData = {
    ...data,
    department_name: data.departments?.name || "Not Assigned",
    designation_name: data.designations?.name || "Not Assigned",
    home_branch_name: data.branches?.name || "Not Assigned",
    primary_company_name: data.companies?.name || "Not Assigned",
  }

  return transformedData
}

export async function getEmployeeCompanies(employeeId: string): Promise<EmployeeCompany[]> {
  try {
    console.log("getEmployeeCompanies called with employeeId:", employeeId)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("employee_companies")
      .select(`
        id,
        employee_id,
        company_id,
        branch_id,
        allocation_percentage,
        is_primary,
        companies(id, name),
        branches(id, name)
      `)
      .eq("employee_id", employeeId)

    if (error) {
      console.error("Error fetching employee companies:", error)
      throw new Error(`Failed to fetch employee companies: ${error.message}`)
    }

    console.log("Employee companies data:", data)

    // Transform the data to match the EmployeeCompany type
    const transformedData: EmployeeCompany[] = data.map((item) => ({
      id: item.id,
      employee_id: item.employee_id,
      company_id: item.company_id,
      branch_id: item.branch_id,
      company_name: item.companies?.name || "Unknown Company",
      branch_name: item.branches?.name || "Unknown Branch",
      allocation_percentage: item.allocation_percentage || 0,
      is_primary: item.is_primary || false,
    }))

    console.log("Transformed employee companies:", transformedData)
    return transformedData
  } catch (error) {
    console.error("Error in getEmployeeCompanies:", error)
    throw error
  }
}

export async function createEmployee(formData: FormData) {
  const supabase = createClient()

  try {
    // Generate employee ID
    const employeeId = await generateEmployeeIdUtil(
      formData.get("primary_company_id") as string,
      formData.get("first_name") as string,
      formData.get("last_name") as string,
    )

    // Insert employee
    const { data, error } = await supabase
      .from("employees")
      .insert({
        employee_id: employeeId,
        first_name: formData.get("first_name"),
        last_name: formData.get("last_name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        address: formData.get("address"),
        city: formData.get("city"),
        state: formData.get("state"),
        zip_code: formData.get("zip_code"),
        country: formData.get("country"),
        hire_date: formData.get("hire_date"),
        termination_date: formData.get("termination_date") || null,
        status: formData.get("status"),
        department_id: formData.get("department_id") ? Number.parseInt(formData.get("department_id") as string) : null,
        designation_id: formData.get("designation_id")
          ? Number.parseInt(formData.get("designation_id") as string)
          : null,
        job_title: formData.get("job_title"),
        home_branch_id: formData.get("home_branch_id")
          ? Number.parseInt(formData.get("home_branch_id") as string)
          : null,
        primary_company_id: formData.get("primary_company_id")
          ? Number.parseInt(formData.get("primary_company_id") as string)
          : null,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating employee: ${error.message}`)
    }

    // Create primary company allocation (100%)
    await supabase.from("employee_companies").insert({
      employee_id: data.id,
      company_id: formData.get("primary_company_id")
        ? Number.parseInt(formData.get("primary_company_id") as string)
        : null,
      branch_id: formData.get("home_branch_id") ? Number.parseInt(formData.get("home_branch_id") as string) : null,
      allocation_percentage: 100,
      is_primary: true,
    })

    revalidatePath("/people/employees")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error creating employee:", error)
    return { success: false, error: error.message }
  }
}

export async function updateEmployee(id: string, formData: FormData) {
  const supabase = createClient()

  try {
    // Update employee with proper null handling
    const { data, error } = await supabase
      .from("employees")
      .update({
        first_name: formData.get("first_name") || null,
        last_name: formData.get("last_name") || null,
        email: formData.get("email") || null,
        phone: formData.get("phone") || null,
        address: formData.get("address") || null,
        city: formData.get("city") || null,
        state: formData.get("state") || null,
        zip_code: formData.get("zip_code") || null,
        country: formData.get("country") || null,
        hire_date: formData.get("hire_date") || null,
        termination_date: formData.get("termination_date") || null,
        status: formData.get("status") || null,
        department_id: formData.get("department_id") ? Number.parseInt(formData.get("department_id") as string) : null,
        designation_id: formData.get("designation_id")
          ? Number.parseInt(formData.get("designation_id") as string)
          : null,
        job_title: formData.get("job_title") || null,
        home_branch_id: formData.get("home_branch_id")
          ? Number.parseInt(formData.get("home_branch_id") as string)
          : null,
        primary_company_id: formData.get("primary_company_id")
          ? Number.parseInt(formData.get("primary_company_id") as string)
          : null,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating employee: ${error.message}`)
    }

    // Update primary company if changed
    const { data: primaryCompany } = await supabase
      .from("employee_companies")
      .select("*")
      .eq("employee_id", id)
      .eq("is_primary", true)
      .single()

    if (
      primaryCompany && primaryCompany.company_id !== formData.get("primary_company_id")
        ? Number.parseInt(formData.get("primary_company_id") as string)
        : null
    ) {
      await supabase
        .from("employee_companies")
        .update({
          company_id: formData.get("primary_company_id")
            ? Number.parseInt(formData.get("primary_company_id") as string)
            : null,
          branch_id: formData.get("home_branch_id") ? Number.parseInt(formData.get("home_branch_id") as string) : null,
        })
        .eq("id", primaryCompany.id)
    }

    revalidatePath(`/people/employees/${id}`)
    revalidatePath("/people/employees")
    return { success: true, data }
  } catch (error: any) {
    console.error("Error updating employee:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteEmployee(id: string) {
  const supabase = createClient()

  try {
    // Delete employee companies first (foreign key constraint)
    await supabase.from("employee_companies").delete().eq("employee_id", id)

    // Delete employee
    const { error } = await supabase.from("employees").delete().eq("id", id)

    if (error) {
      throw new Error(`Error deleting employee: ${error.message}`)
    }

    revalidatePath("/people/employees")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting employee:", error)
    return { success: false, error: error.message }
  }
}

export async function addEmployeeCompany(employeeId: number | string, formData: FormData) {
  const supabase = createClient()

  try {
    // Convert employeeId to number if it's a string
    const numericEmployeeId = typeof employeeId === "string" ? Number.parseInt(employeeId, 10) : employeeId

    // Check if total allocation would exceed 100%
    const { data: existingAllocations } = await supabase
      .from("employee_companies")
      .select("allocation_percentage, company_id, branch_id")
      .eq("employee_id", numericEmployeeId)

    const companyId = formData.get("company_id") ? Number.parseInt(formData.get("company_id") as string) : null
    const branchId = formData.get("branch_id") ? Number.parseInt(formData.get("branch_id") as string) : null

    // Calculate total existing allocation, excluding the company-branch we're adding/updating
    const totalExistingAllocation =
      existingAllocations
        ?.filter((item) => !(item.company_id === companyId && item.branch_id === branchId))
        .reduce((sum, item) => sum + (item.allocation_percentage || 0), 0) || 0

    const newAllocationPercentage = Number.parseInt(formData.get("allocation_percentage") as string)

    if (totalExistingAllocation + newAllocationPercentage > 100) {
      throw new Error(
        `Total allocation would exceed 100%. Current total: ${totalExistingAllocation}%, Trying to add: ${newAllocationPercentage}%, Available: ${100 - totalExistingAllocation}%`,
      )
    }

    // Check if this company-branch combination already exists for this employee
    const { data: existingAllocation } = await supabase
      .from("employee_companies")
      .select("*")
      .eq("employee_id", numericEmployeeId)
      .eq("company_id", companyId)
      .eq("branch_id", branchId)
      .maybeSingle()

    // Prepare the data object without start_date and end_date
    const baseData = {
      employee_id: numericEmployeeId,
      company_id: companyId,
      branch_id: branchId,
      allocation_percentage: newAllocationPercentage,
      is_primary: formData.get("is_primary") === "true",
    }

    // Check if the table has start_date and end_date columns
    const { data: columnsData } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "employee_companies")
      .in("column_name", ["start_date", "end_date"])

    // Create a map of column existence
    const columnExists = {
      start_date: columnsData?.some((col) => col.column_name === "start_date") || false,
      end_date: columnsData?.some((col) => col.column_name === "end_date") || false,
      project_id: columnsData?.some((col) => col.column_name === "project_id") || false,
    }

    // Add optional fields if they exist in the table
    const fullData: any = { ...baseData }

    if (columnExists.start_date && formData.get("start_date")) {
      fullData.start_date = formData.get("start_date")
    }

    if (columnExists.end_date && formData.get("end_date")) {
      fullData.end_date = formData.get("end_date")
    }

    if (columnExists.project_id && formData.get("project_id")) {
      fullData.project_id = Number.parseInt(formData.get("project_id") as string)
    }

    let result

    if (existingAllocation) {
      // Update existing allocation
      result = await supabase
        .from("employee_companies")
        .update(fullData)
        .eq("id", existingAllocation.id)
        .select()
        .single()
    } else {
      // Insert new allocation
      result = await supabase.from("employee_companies").insert(fullData).select().single()
    }

    if (result.error) {
      throw new Error(`Error managing employee company: ${result.error.message}`)
    }

    // If this is the primary company, update employee record
    if (formData.get("is_primary") === "true") {
      // Update all other companies to not be primary
      await supabase
        .from("employee_companies")
        .update({ is_primary: false })
        .eq("employee_id", numericEmployeeId)
        .neq("id", result.data.id)

      // Update employee record
      await supabase
        .from("employees")
        .update({
          primary_company_id: companyId,
          home_branch_id: branchId,
        })
        .eq("id", numericEmployeeId)
    }

    revalidatePath(`/people/employees/${numericEmployeeId}`)
    revalidatePath(`/people/employees/${numericEmployeeId}/edit`)
    return { success: true, data: result.data }
  } catch (error: any) {
    console.error("Error managing employee company:", error)
    return { success: false, error: error.message }
  }
}

export async function removeEmployeeCompany(employeeId: string, companyId: string) {
  const supabase = createClient()

  try {
    // Check if this is the primary company
    const { data: companyData } = await supabase
      .from("employee_companies")
      .select("is_primary")
      .eq("employee_id", employeeId)
      .eq("company_id", companyId)
      .single()

    if (companyData?.is_primary) {
      throw new Error("Cannot remove primary company. Please assign a different primary company first.")
    }

    // Delete the company allocation
    const { error } = await supabase
      .from("employee_companies")
      .delete()
      .eq("employee_id", employeeId)
      .eq("company_id", companyId)

    if (error) {
      throw new Error(`Error removing employee company: ${error.message}`)
    }

    revalidatePath(`/people/employees/${employeeId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error removing employee company:", error)
    return { success: false, error: error.message }
  }
}

export async function getDepartments() {
  const supabase = createClient()

  const { data, error } = await supabase.from("departments").select("*").order("name")

  if (error) {
    console.error("Error fetching departments:", error)
    throw new Error(`Error fetching departments: ${error.message}`)
  }

  return data
}

export async function getDesignations() {
  const supabase = createClient()

  const { data, error } = await supabase.from("designations").select("*").order("name")

  if (error) {
    console.error("Error fetching designations:", error)
    throw new Error(`Error fetching designations: ${error.message}`)
  }

  return data
}

export async function getCompanies() {
  const supabase = createClient()

  const { data, error } = await supabase.from("companies").select("*").order("name")

  if (error) {
    console.error("Error fetching companies:", error)
    throw new Error(`Error fetching companies: ${error.message}`)
  }

  return data
}

export async function getBranchesByCompany(companyId: number): Promise<Branch[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("branches").select("*").eq("company_id", companyId).order("name")

  if (error) {
    console.error("Error fetching branches:", error)
    throw new Error("Failed to fetch branches")
  }

  return data
}

export async function getBranches() {
  const supabase = createClient()

  const { data, error } = await supabase.from("branches").select("*").order("name")

  if (error) {
    console.error("Error fetching branches:", error)
    throw new Error(`Error fetching branches: ${error.message}`)
  }

  return data
}

export async function updateEmployeeCompany(id: string, formData: FormData) {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("employee_companies")
      .update({
        branch_id: formData.get("branch_id") ? Number.parseInt(formData.get("branch_id") as string) : null,
        allocation_percentage: Number.parseInt(formData.get("allocation_percentage") as string),
        is_primary: formData.get("is_primary") === "true",
      })
      .eq("id", id)

    if (error) {
      throw new Error(`Error updating employee company: ${error.message}`)
    }

    revalidatePath(`/people/employees/${id}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error updating employee company:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteEmployeeCompany(
  id: string,
  employeeId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // Delete employee company
    const { error } = await supabase.from("employee_companies").delete().eq("id", id)

    if (error) {
      console.error("Error deleting employee company:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/people/employees/${employeeId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting employee company:", error)
    return { success: false, error: error.message }
  }
}

// Add the missing exports as identified in the error message

// Set primary company function
export async function setPrimaryCompany(employeeId: string, allocationId: string): Promise<void> {
  const supabase = createClient()

  try {
    // First get the allocation details to update the employee's primary company and branch
    const { data: allocation, error: fetchError } = await supabase
      .from("employee_companies")
      .select("*")
      .eq("id", allocationId)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch allocation: ${fetchError.message}`)
    }

    // Update all employee allocations to not be primary
    const { error: updateAllocationsError } = await supabase
      .from("employee_companies")
      .update({ is_primary: false })
      .eq("employee_id", employeeId)

    if (updateAllocationsError) {
      throw new Error(`Failed to update allocations: ${updateAllocationsError.message}`)
    }

    // Set the selected allocation as primary
    const { error: setPrimaryError } = await supabase
      .from("employee_companies")
      .update({ is_primary: true })
      .eq("id", allocationId)

    if (setPrimaryError) {
      throw new Error(`Failed to set primary allocation: ${setPrimaryError.message}`)
    }

    // Update the employee's primary company and home branch
    const { error: updateEmployeeError } = await supabase
      .from("employees")
      .update({
        primary_company_id: allocation.company_id,
        home_branch_id: allocation.branch_id,
      })
      .eq("id", employeeId)

    if (updateEmployeeError) {
      throw new Error(`Failed to update employee: ${updateEmployeeError.message}`)
    }

    revalidatePath(`/people/employees/${employeeId}`)
    revalidatePath(`/people/employees/${employeeId}/edit`)
    revalidatePath("/people/employees")
  } catch (error) {
    console.error("Error setting primary company:", error)
    throw error
  }
}

// Get projects by company function
export async function getProjectsByCompany(companyId: number) {
  const supabase = createClient()

  try {
    // Check if projects table exists
    const { data: tableExists } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "projects")
      .maybeSingle()

    if (!tableExists) {
      console.log("Projects table does not exist, returning empty array")
      return []
    }

    // If table exists, query the projects
    const { data, error } = await supabase.from("projects").select("id, name").eq("company_id", companyId).order("name")

    if (error) {
      console.error("Error fetching projects:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getProjectsByCompany:", error)
    return []
  }
}

export const generateEmployeeId = generateEmployeeIdUtil
