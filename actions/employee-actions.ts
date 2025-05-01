"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Employee, Department, Designation, Company, Branch, EmployeeCompany } from "@/types/employee"

// Add employee (alias for createEmployee for backward compatibility)
export async function addEmployee(formData: FormData): Promise<void> {
  return createEmployee(formData)
}

// Get all employees with related data
export async function getEmployees(): Promise<Employee[]> {
  const supabase = createClient()

  try {
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

    if (error) throw error

    return (
      data?.map((employee) => ({
        ...employee,
        department_name: employee.departments?.name || null,
        designation_name: employee.designations?.name || null,
        home_branch_name: employee.branches?.name || null,
        primary_company_name: employee.companies?.name || null,
      })) || []
    )
  } catch (error) {
    console.error("Error fetching employees:", error)
    throw error
  }
}

// Get a single employee by ID
export async function getEmployee(id: string): Promise<Employee | null> {
  // If the ID is "add", return null (for the add page)
  if (id === "add") {
    return null
  }

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
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching employee:", error)
    throw new Error("Failed to fetch employee")
  }

  return {
    ...data,
    department_name: data.departments?.name || null,
    designation_name: data.designations?.name || null,
    home_branch_name: data.branches?.name || null,
    primary_company_name: data.companies?.name || null,
  }
}

// Create a new employee
export async function createEmployee(formData: FormData): Promise<void> {
  const supabase = createClient()

  // Extract form data
  const employee_id = formData.get("employee_id") as string
  const first_name = formData.get("first_name") as string
  const last_name = formData.get("last_name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const city = formData.get("city") as string
  const state = formData.get("state") as string
  const zip_code = formData.get("zip_code") as string
  const country = formData.get("country") as string
  const hire_date = formData.get("hire_date") as string
  const job_title = formData.get("job_title") as string
  const department_id = formData.get("department_id") as string
  const designation_id = formData.get("designation_id") as string
  const primary_company_id = formData.get("primary_company_id") as string
  const home_branch_id = formData.get("home_branch_id") as string

  // Prepare employee data
  const employeeData: any = {
    employee_id,
    first_name,
    last_name,
    email: email || null,
    phone: phone || null,
    address: address || null,
    city: city || null,
    state: state || null,
    zip_code: zip_code || null,
    country: country || null,
    hire_date: hire_date || null,
    job_title: job_title || null,
    status: "active",
  }

  // Add optional fields if they exist
  if (department_id && department_id !== "none") {
    employeeData.department_id = Number.parseInt(department_id)
  }
  if (designation_id && designation_id !== "none") {
    employeeData.designation_id = Number.parseInt(designation_id)
  }
  if (primary_company_id && primary_company_id !== "none") {
    employeeData.primary_company_id = Number.parseInt(primary_company_id)
  }
  if (home_branch_id && home_branch_id !== "none") {
    employeeData.home_branch_id = Number.parseInt(home_branch_id)
  }

  // Insert employee
  const { data, error } = await supabase.from("employees").insert(employeeData).select().single()

  if (error) {
    console.error("Error creating employee:", error)
    throw new Error("Failed to create employee")
  }

  // If primary company and home branch are set, create a primary company allocation
  if (primary_company_id && primary_company_id !== "none" && home_branch_id && home_branch_id !== "none") {
    const { error: allocationError } = await supabase.from("employee_companies").insert({
      employee_id: data.id,
      company_id: Number.parseInt(primary_company_id),
      branch_id: Number.parseInt(home_branch_id),
      allocation_percentage: 100,
      is_primary: true,
    })

    if (allocationError) {
      console.error("Error creating employee company allocation:", allocationError)
      // Continue anyway, as the employee was created successfully
    }
  }

  revalidatePath("/people/employees")
  redirect("/people/employees")
}

// Update an employee
export async function updateEmployee(id: string, formData: FormData): Promise<void> {
  const supabase = createClient()

  // Extract form data
  const first_name = formData.get("first_name") as string
  const last_name = formData.get("last_name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const city = formData.get("city") as string
  const state = formData.get("state") as string
  const zip_code = formData.get("zip_code") as string
  const country = formData.get("country") as string
  const hire_date = formData.get("hire_date") as string
  const termination_date = formData.get("termination_date") as string
  const status = formData.get("status") as string
  const job_title = formData.get("job_title") as string
  const department_id = formData.get("department_id") as string
  const designation_id = formData.get("designation_id") as string
  const primary_company_id = formData.get("primary_company_id") as string
  const home_branch_id = formData.get("home_branch_id") as string

  // Prepare employee data
  const employeeData: any = {
    first_name,
    last_name,
    email: email || null,
    phone: phone || null,
    address: address || null,
    city: city || null,
    state: state || null,
    zip_code: zip_code || null,
    country: country || null,
    hire_date: hire_date || null,
    termination_date: termination_date || null,
    status,
    job_title: job_title || null,
  }

  // Handle optional fields
  if (department_id === "none") {
    employeeData.department_id = null
  } else if (department_id) {
    employeeData.department_id = Number.parseInt(department_id)
  }

  if (designation_id === "none") {
    employeeData.designation_id = null
  } else if (designation_id) {
    employeeData.designation_id = Number.parseInt(designation_id)
  }

  if (primary_company_id === "none") {
    employeeData.primary_company_id = null
  } else if (primary_company_id) {
    employeeData.primary_company_id = Number.parseInt(primary_company_id)
  }

  if (home_branch_id === "none") {
    employeeData.home_branch_id = null
  } else if (home_branch_id) {
    employeeData.home_branch_id = Number.parseInt(home_branch_id)
  }

  // Update employee
  const { error } = await supabase.from("employees").update(employeeData).eq("id", id)

  if (error) {
    console.error("Error updating employee:", error)
    throw new Error("Failed to update employee")
  }

  // If primary company and home branch are set, update or create the primary company allocation
  if (primary_company_id && primary_company_id !== "none" && home_branch_id && home_branch_id !== "none") {
    // First, check if a primary allocation exists
    const { data: existingAllocation } = await supabase
      .from("employee_companies")
      .select("*")
      .eq("employee_id", id)
      .eq("is_primary", true)
      .maybeSingle()

    if (existingAllocation) {
      // Update existing primary allocation
      const { error: updateError } = await supabase
        .from("employee_companies")
        .update({
          company_id: Number.parseInt(primary_company_id),
          branch_id: Number.parseInt(home_branch_id),
        })
        .eq("id", existingAllocation.id)

      if (updateError) {
        console.error("Error updating primary company allocation:", updateError)
      }
    } else {
      // Create new primary allocation
      const { error: insertError } = await supabase.from("employee_companies").insert({
        employee_id: Number.parseInt(id),
        company_id: Number.parseInt(primary_company_id),
        branch_id: Number.parseInt(home_branch_id),
        allocation_percentage: 100,
        is_primary: true,
      })

      if (insertError) {
        console.error("Error creating primary company allocation:", insertError)
      }
    }
  }

  revalidatePath(`/people/employees/${id}`)
  revalidatePath("/people/employees")
}

// Delete an employee
export async function deleteEmployee(id: string) {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("employees").delete().eq("id", id)

    if (error) throw error

    // Revalidate the employees page
    revalidatePath("/people/employees")

    // Return success instead of redirecting
    return { success: true }
  } catch (error) {
    console.error("Error deleting employee:", error)
    throw error
  }
}

// Get employee companies
export async function getEmployeeCompanies(employeeId: string): Promise<EmployeeCompany[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("employee_companies")
    .select(`
      *,
      companies:company_id(name),
      branches:branch_id(name)
    `)
    .eq("employee_id", employeeId)
    .order("is_primary", { ascending: false })

  if (error) {
    console.error("Error fetching employee companies:", error)
    throw new Error("Failed to fetch employee companies")
  }

  return data.map((ec) => ({
    ...ec,
    company_name: ec.companies?.name || null,
    branch_name: ec.branches?.name || null,
  }))
}

// Add employee company
export async function addEmployeeCompany(employeeId: string, formData: FormData): Promise<void> {
  const supabase = createClient()

  const company_id = Number.parseInt(formData.get("company_id") as string)
  const branch_id = Number.parseInt(formData.get("branch_id") as string)
  const allocation_percentage = Number.parseInt(formData.get("allocation_percentage") as string)

  // Check if allocation would exceed 100%
  const { data: existingAllocations } = await supabase
    .from("employee_companies")
    .select("allocation_percentage")
    .eq("employee_id", employeeId)

  const totalAllocation = existingAllocations?.reduce((sum, ec) => sum + ec.allocation_percentage, 0) || 0
  if (totalAllocation + allocation_percentage > 100) {
    throw new Error("Total allocation percentage cannot exceed 100%")
  }

  // Insert employee company
  const { error } = await supabase.from("employee_companies").insert({
    employee_id: Number.parseInt(employeeId),
    company_id,
    branch_id,
    allocation_percentage,
    is_primary: false,
  })

  if (error) {
    console.error("Error adding employee company:", error)
    throw new Error("Failed to add employee company")
  }

  revalidatePath(`/people/employees/${employeeId}`)
}

// Update employee company
export async function updateEmployeeCompany(id: string, formData: FormData): Promise<void> {
  const supabase = createClient()

  const employee_id = Number.parseInt(formData.get("employee_id") as string)
  const company_id = Number.parseInt(formData.get("company_id") as string)
  const branch_id = Number.parseInt(formData.get("branch_id") as string)
  const allocation_percentage = Number.parseInt(formData.get("allocation_percentage") as string)

  // Get current allocation
  const { data: currentAllocation } = await supabase
    .from("employee_companies")
    .select("allocation_percentage")
    .eq("id", id)
    .single()

  // Check if allocation would exceed 100%
  const { data: existingAllocations } = await supabase
    .from("employee_companies")
    .select("allocation_percentage")
    .eq("employee_id", employee_id)
    .neq("id", id)

  const totalAllocation = existingAllocations?.reduce((sum, ec) => sum + ec.allocation_percentage, 0) || 0
  if (totalAllocation + allocation_percentage > 100) {
    throw new Error("Total allocation percentage cannot exceed 100%")
  }

  // Update employee company
  const { error } = await supabase
    .from("employee_companies")
    .update({
      company_id,
      branch_id,
      allocation_percentage,
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating employee company:", error)
    throw new Error("Failed to update employee company")
  }

  revalidatePath(`/people/employees/${employee_id}`)
}

// Delete employee company
export async function deleteEmployeeCompany(id: string, employeeId: string): Promise<void> {
  const supabase = createClient()

  // Delete employee company
  const { error } = await supabase.from("employee_companies").delete().eq("id", id)

  if (error) {
    console.error("Error deleting employee company:", error)
    throw new Error("Failed to delete employee company")
  }

  revalidatePath(`/people/employees/${employeeId}`)
}

// Get departments
export async function getDepartments(): Promise<Department[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("departments").select("*").order("name")

  if (error) {
    console.error("Error fetching departments:", error)
    throw new Error("Failed to fetch departments")
  }

  return data
}

// Get designations
export async function getDesignations(): Promise<Designation[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("designations").select("*").order("name")

  if (error) {
    console.error("Error fetching designations:", error)
    throw new Error("Failed to fetch designations")
  }

  return data
}

// Get companies
export async function getCompanies(): Promise<Company[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("companies").select("*").order("name")

  if (error) {
    console.error("Error fetching companies:", error)
    throw new Error("Failed to fetch companies")
  }

  return data
}

// Get branches by company
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

  // Get branches
  const { data: branches, error } = await supabase.from("branches").select("*").order("name")

  if (error) {
    console.error("Error fetching branches:", error)
    return []
  }

  // If no branches, return empty array
  if (!branches || branches.length === 0) {
    return []
  }

  // Get company ids
  const companyIds = branches.map((branch) => branch.company_id).filter((id) => id !== null) as number[]

  // Fetch companies
  const { data: companies } = await supabase.from("companies").select("id, name").in("id", companyIds)

  // Create company lookup map
  const companyMap = new Map(companies?.map((c) => [c.id, c.name]) || [])

  // Return branches with company names
  return branches.map((branch) => ({
    ...branch,
    company_name: branch.company_id ? companyMap.get(branch.company_id) : null,
  }))
}

// Update the generateEmployeeId function to be more robust
export async function generateEmployeeId() {
  const supabase = createClient()

  try {
    // Get the current year
    const currentYear = new Date().getFullYear().toString().slice(-2)

    // Get the count of employees for this year
    const { count, error } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .like("employee_id", `EMP-${currentYear}%`)

    if (error) {
      console.error("Error counting employees:", error)
      return `EMP-${currentYear}-0001`
    }

    // Generate the next employee ID
    const nextNumber = (count || 0) + 1
    const paddedNumber = nextNumber.toString().padStart(4, "0")

    return `EMP-${currentYear}-${paddedNumber}`
  } catch (error) {
    console.error("Error generating employee ID:", error)
    // Fallback to a timestamp-based ID if there's an error
    const timestamp = new Date().getTime().toString().slice(-6)
    return `EMP-${timestamp}`
  }
}
