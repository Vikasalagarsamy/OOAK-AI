"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { Employee, Department, Designation, Company, Branch, EmployeeCompany, Project } from "@/types/employee"
import { tableExists } from "@/lib/db-utils"

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
export async function createEmployee(formData: FormData): Promise<any> {
  const supabase = createClient()

  try {
    // Extract form data
    let employee_id = formData.get("employee_id") as string
    const first_name = formData.get("first_name") as string
    const last_name = formData.get("last_name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string
    const city = formData.get("city") as string
    const state_value = formData.get("state") as string
    const zip_code = formData.get("zip_code") as string
    const country = formData.get("country") as string
    const job_title = formData.get("job_title") as string
    const department_id = formData.get("department_id") as string
    const designation_id = formData.get("designation_id") as string
    const primary_company_id = formData.get("primary_company_id") as string
    const home_branch_id = formData.get("home_branch_id") as string
    const allocations_json = formData.get("allocations_json") as string

    let allocations = []
    if (allocations_json) {
      try {
        allocations = JSON.parse(allocations_json)
      } catch (error) {
        console.error("Error parsing allocations JSON:", error)
        throw new Error("Invalid allocations data format")
      }
    }

    // Validate required fields
    if (!first_name || !last_name) {
      throw new Error("First name and last name are required")
    }

    // Check if employee ID already exists
    const { data: existingEmployeeWithId } = await supabase
      .from("employees")
      .select("id")
      .eq("employee_id", employee_id)
      .single()

    // If employee ID already exists, generate a new one
    if (existingEmployeeWithId) {
      console.log("Employee ID already exists, generating a new one")
      // Generate a new ID (implementation depends on your ID generation logic)
      const timestamp = new Date().getTime().toString().slice(-6)
      employee_id = `EMP-${timestamp}`
    }

    // Check if email already exists (only if email is provided)
    if (email && email.trim() !== "") {
      const { data: existingEmployeeWithEmail } = await supabase
        .from("employees")
        .select("id, email")
        .eq("email", email)
        .single()

      if (existingEmployeeWithEmail) {
        throw new Error(`Email ${email} is already in use by another employee. Please use a different email address.`)
      }
    }

    // Validate department and designation relationship
    if (department_id && department_id !== "none" && designation_id && designation_id !== "none") {
      const { data: designation } = await supabase
        .from("designations")
        .select("department_id")
        .eq("id", designation_id)
        .single()

      if (designation && designation.department_id !== Number.parseInt(department_id)) {
        throw new Error("The selected designation does not belong to the selected department")
      }
    }

    // Prepare employee data
    const employeeData: any = {
      employee_id,
      first_name,
      last_name,
      email: email && email.trim() !== "" ? email : null, // Set to null if empty
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state_value || null,
      zip_code: zip_code || null,
      country: country || null,
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

      // Handle specific error cases
      if (error.code === "23505") {
        // Unique constraint violation
        if (error.message.includes("employees_email_key")) {
          throw new Error("This email address is already in use. Please use a different email.")
        } else if (error.message.includes("employees_employee_id_key")) {
          throw new Error("Employee ID is already in use. Please try again.")
        }
      }

      throw new Error(`Failed to create employee: ${error.message}`)
    }

    // Handle company allocations
    if (allocations && allocations.length > 0) {
      // Validate total allocation percentage
      const totalPercentage = allocations.reduce((sum, allocation) => sum + allocation.allocation_percentage, 0)

      if (totalPercentage !== 100) {
        // Delete the employee since allocations are invalid
        await supabase.from("employees").delete().eq("id", data.id)
        throw new Error(`Total allocation percentage must equal 100%. Current total: ${totalPercentage}%`)
      }

      // Check for duplicate company allocations
      const companyIds = new Set()
      const duplicateCompanies = []

      for (const allocation of allocations) {
        if (companyIds.has(allocation.company_id)) {
          duplicateCompanies.push(allocation.company_id)
        }
        companyIds.add(allocation.company_id)
      }

      if (duplicateCompanies.length > 0) {
        // Delete the employee since allocations are invalid
        await supabase.from("employees").delete().eq("id", data.id)
        throw new Error(`Duplicate company allocations detected. An employee can only be allocated to a company once.`)
      }

      // Prepare allocations data
      const allocationData = allocations.map((allocation: any) => ({
        employee_id: data.id,
        company_id: allocation.company_id,
        branch_id: allocation.branch_id,
        allocation_percentage: allocation.allocation_percentage,
        is_primary: allocation.is_primary,
      }))

      // Insert allocations
      const { error: allocationError } = await supabase.from("employee_companies").insert(allocationData)

      if (allocationError) {
        console.error("Error creating employee company allocations:", allocationError)
        // Delete the employee since allocations failed
        await supabase.from("employees").delete().eq("id", data.id)

        // Provide a more specific error message for the unique constraint violation
        if (
          allocationError.code === "23505" &&
          allocationError.message.includes("employee_companies_employee_id_company_id_key")
        ) {
          throw new Error(
            `Failed to create employee company allocations: An employee can only be allocated to a company once.`,
          )
        }

        throw new Error(`Failed to create employee company allocations: ${allocationError.message}`)
      }
    }
    // If no allocations were provided but primary company and branch are set
    else if (primary_company_id && primary_company_id !== "none" && home_branch_id && home_branch_id !== "none") {
      const { error: allocationError } = await supabase.from("employee_companies").insert({
        employee_id: data.id,
        company_id: Number.parseInt(primary_company_id),
        branch_id: Number.parseInt(home_branch_id),
        allocation_percentage: 100,
        is_primary: true,
      })

      if (allocationError) {
        console.error("Error creating employee company allocation:", allocationError)
        // Delete the employee since allocation failed
        await supabase.from("employees").delete().eq("id", data.id)

        // Provide a more specific error message for the unique constraint violation
        if (
          allocationError.code === "23505" &&
          allocationError.message.includes("employee_companies_employee_id_company_id_key")
        ) {
          throw new Error(
            `Failed to create employee company allocation: An employee can only be allocated to a company once.`,
          )
        }

        throw new Error(`Failed to create employee company allocation: ${allocationError.message}`)
      }
    }

    revalidatePath("/people/employees")
    return { success: true, data }
  } catch (error) {
    console.error("Error creating employee:", error)

    // Return structured error
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Update an employee
export async function updateEmployee(id: string, formData: FormData): Promise<any> {
  const supabase = createClient()

  try {
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

    // Validate required fields
    if (!first_name || !last_name) {
      return {
        success: false,
        error: "First name and last name are required",
      }
    }

    // Check if email already exists for a different employee (only if email is provided)
    if (email && email.trim() !== "") {
      const { data: existingEmployeeWithEmail } = await supabase
        .from("employees")
        .select("id, email")
        .eq("email", email)
        .neq("id", id) // Exclude the current employee
        .single()

      if (existingEmployeeWithEmail) {
        return {
          success: false,
          error: `Email ${email} is already in use by another employee. Please use a different email address.`,
        }
      }
    }

    // Validate department and designation relationship
    if (department_id && department_id !== "none" && designation_id && designation_id !== "none") {
      const { data: designation } = await supabase
        .from("designations")
        .select("department_id")
        .eq("id", designation_id)
        .single()

      if (designation && designation.department_id !== Number.parseInt(department_id)) {
        return {
          success: false,
          error: "The selected designation does not belong to the selected department",
        }
      }
    }

    // Prepare employee data
    const employeeData: any = {
      first_name,
      last_name,
      email: email && email.trim() !== "" ? email : null, // Set to null if empty
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

      // Handle specific error cases
      if (error.code === "23505" && error.message.includes("employees_email_key")) {
        return {
          success: false,
          error: "This email address is already in use. Please use a different email.",
        }
      }

      return {
        success: false,
        error: `Failed to update employee: ${error.message}`,
      }
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
          // We still return success since the employee itself was updated
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
          // We still return success since the employee itself was updated
        }
      }
    }

    revalidatePath(`/people/employees/${id}`)
    revalidatePath("/people/employees")

    return { success: true }
  } catch (error) {
    console.error("Error updating employee:", error)

    // Return structured error
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Set primary company (from company allocations)
export async function setPrimaryCompany(employeeId: string, allocationId: string): Promise<void> {
  const supabase = createClient()

  try {
    // Begin transaction
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

// Get all projects
export async function getProjects(): Promise<Project[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("projects").select("*").order("name")

    if (error) {
      console.error("Error fetching projects:", error)
      throw new Error(`Failed to fetch projects: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Exception in getProjects:", error)
    // Return empty array instead of throwing to prevent UI from breaking
    return []
  }
}

// Update the getProjectsByCompany function to handle the case where the projects table doesn't exist

// Get projects by company
export async function getProjectsByCompany(companyId: number) {
  const supabase = createClient()

  try {
    // Check if projects table exists
    const projectsTableExists = await tableExists("projects")

    if (!projectsTableExists) {
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

// Get employee companies with enhanced allocation information
export async function getEmployeeCompanies(employeeId: string): Promise<EmployeeCompany[]> {
  const supabase = createClient()

  try {
    // Check if the employee_companies table has the project_id column
    let hasProjectId = false
    try {
      const projectIdResult = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "employee_companies")
        .eq("column_name", "project_id")
        .single()

      hasProjectId = !!projectIdResult.data
    } catch (error) {
      console.log("Error checking project_id column:", error)
      // Continue with hasProjectId = false
    }

    // Check if the employee_companies table has the start_date column
    let hasStartDate = false
    try {
      const startDateResult = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "employee_companies")
        .eq("column_name", "start_date")
        .single()

      hasStartDate = !!startDateResult.data
    } catch (error) {
      console.log("Error checking start_date column:", error)
      // Continue with hasStartDate = false
    }

    // Check if the employee_companies table has the status column
    let hasStatus = false
    try {
      const statusResult = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "employee_companies")
        .eq("column_name", "status")
        .single()

      hasStatus = !!statusResult.data
    } catch (error) {
      console.log("Error checking status column:", error)
      // Continue with hasStatus = false
    }

    // Basic query that will work with any schema
    let query = `
      *,
      companies:company_id(name),
      branches:branch_id(name)
    `

    // Add project join if the column exists
    if (hasProjectId) {
      query += `,
      projects:project_id(name)
      `
    }

    // Execute the query
    const { data, error } = await supabase
      .from("employee_companies")
      .select(query)
      .eq("employee_id", employeeId)
      .order("is_primary", { ascending: false })

    if (error) {
      console.error("Error fetching employee companies:", error)
      throw new Error(`Failed to fetch employee companies: ${error.message}`)
    }

    // Map the data to include all required fields, with defaults for missing columns
    return data.map((ec) => ({
      ...ec,
      company_name: ec.companies?.name || null,
      branch_name: ec.branches?.name || null,
      project_name: ec.projects?.name || null,
      // Add default values for new fields if they don't exist
      start_date: ec.start_date || new Date(),
      end_date: ec.end_date || null,
      status: ec.status || "active",
    }))
  } catch (error) {
    console.error("Error in getEmployeeCompanies:", error)

    // Final fallback - try a very simple query
    try {
      const { data, error } = await supabase
        .from("employee_companies")
        .select("*, companies:company_id(name), branches:branch_id(name)")
        .eq("employee_id", employeeId)
        .order("is_primary", { ascending: false })

      if (error) {
        console.error("Error in fallback query:", error)
        return []
      }

      return data.map((ec) => ({
        ...ec,
        company_name: ec.companies?.name || null,
        branch_name: ec.branches?.name || null,
        project_id: null,
        project_name: null,
        start_date: ec.start_date || new Date(),
        end_date: ec.end_date || null,
        status: ec.status || "active",
      }))
    } catch (finalError) {
      console.error("Final error in getEmployeeCompanies:", finalError)
      return []
    }
  }
}

// Add employee company with enhanced allocation information
export async function addEmployeeCompany(employeeId: string, formData: FormData): Promise<void> {
  const supabase = createClient()

  const company_id = Number.parseInt(formData.get("company_id") as string)
  const branch_id = Number.parseInt(formData.get("branch_id") as string)
  const project_id = formData.get("project_id") ? Number.parseInt(formData.get("project_id") as string) : null
  const allocation_percentage = Number.parseInt(formData.get("allocation_percentage") as string)
  const start_date = formData.get("start_date") as string
  const end_date = (formData.get("end_date") as string) || null

  try {
    // Check if the employee_companies table has the project_id column
    let hasProjectId = false
    try {
      const projectIdResult = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "employee_companies")
        .eq("column_name", "project_id")
        .single()

      hasProjectId = !!projectIdResult.data
    } catch (error) {
      console.log("Error checking project_id column:", error)
      // Continue with hasProjectId = false
    }

    // Check if the employee_companies table has the start_date column
    let hasStartDate = false
    try {
      const startDateResult = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "employee_companies")
        .eq("column_name", "start_date")
        .single()

      hasStartDate = !!startDateResult.data
    } catch (error) {
      console.log("Error checking start_date column:", error)
      // Continue with hasStartDate = false
    }

    // Check if the employee_companies table has the status column
    let hasStatus = false
    try {
      const statusResult = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "employee_companies")
        .eq("column_name", "status")
        .single()

      hasStatus = !!statusResult.data
    } catch (error) {
      console.log("Error checking status column:", error)
      // Continue with hasStatus = false
    }

    // Prepare the data object based on available columns
    const insertData: any = {
      employee_id: Number.parseInt(employeeId),
      company_id,
      branch_id,
      allocation_percentage,
      is_primary: false,
    }

    // Add optional fields if the columns exist
    if (hasProjectId && project_id) {
      insertData.project_id = project_id
    }

    if (hasStartDate) {
      insertData.start_date = start_date || new Date().toISOString().split("T")[0]
      if (end_date) {
        insertData.end_date = end_date
      }
    }

    if (hasStatus) {
      // Determine status based on dates
      if (start_date && new Date(start_date) > new Date()) {
        insertData.status = "pending"
      } else if (end_date && new Date(end_date) < new Date()) {
        insertData.status = "expired"
      } else {
        insertData.status = "active"
      }
    }

    // Insert employee company
    const { error } = await supabase.from("employee_companies").insert(insertData)

    if (error) {
      console.error("Error adding employee company:", error)

      // Handle specific error cases
      if (error.code === "23505" && error.message.includes("employee_companies_employee_id_company_id_key")) {
        throw new Error(
          "This employee already has an allocation for this company. Each company can only be allocated once per employee.",
        )
      }

      if (error.message.includes("validate_employee_allocation")) {
        throw new Error(error.message.replace(/^[^:]+: /, ""))
      }

      throw new Error("Failed to add employee company")
    }

    revalidatePath(`/people/employees/${employeeId}`)
    revalidatePath(`/people/employees/${employeeId}/edit`)
  } catch (error) {
    console.error("Error in addEmployeeCompany:", error)
    throw error
  }
}

// Update employee company with enhanced allocation information
export async function updateEmployeeCompany(id: string, formData: FormData): Promise<void> {
  const supabase = createClient()

  const employee_id = Number.parseInt(formData.get("employee_id") as string)
  const branch_id = Number.parseInt(formData.get("branch_id") as string)
  const project_id = formData.get("project_id") ? Number.parseInt(formData.get("project_id") as string) : null
  const allocation_percentage = Number.parseInt(formData.get("allocation_percentage") as string)
  const start_date = formData.get("start_date") as string
  const end_date = (formData.get("end_date") as string) || null

  try {
    // Check if the employee_companies table has the project_id column
    let hasProjectId = false
    try {
      const projectIdResult = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "employee_companies")
        .eq("column_name", "project_id")
        .single()

      hasProjectId = !!projectIdResult.data
    } catch (error) {
      console.log("Error checking project_id column:", error)
      // Continue with hasProjectId = false
    }

    // Check if the employee_companies table has the start_date column
    let hasStartDate = false
    try {
      const startDateResult = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "employee_companies")
        .eq("column_name", "start_date")
        .single()

      hasStartDate = !!startDateResult.data
    } catch (error) {
      console.log("Error checking start_date column:", error)
      // Continue with hasStartDate = false
    }

    // Check if the employee_companies table has the status column
    let hasStatus = false
    try {
      const statusResult = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "employee_companies")
        .eq("column_name", "status")
        .single()

      hasStatus = !!statusResult.data
    } catch (error) {
      console.log("Error checking status column:", error)
      // Continue with hasStatus = false
    }

    // Prepare the update data object based on available columns
    const updateData: any = {
      branch_id,
      allocation_percentage,
    }

    // Add optional fields if the columns exist
    if (hasProjectId) {
      updateData.project_id = project_id
    }

    if (hasStartDate) {
      updateData.start_date = start_date || null
      if (end_date) {
        updateData.end_date = end_date
      } else {
        updateData.end_date = null
      }
    }

    if (hasStatus) {
      // Determine status based on dates
      if (start_date && new Date(start_date) > new Date()) {
        updateData.status = "pending"
      } else if (end_date && new Date(end_date) < new Date()) {
        updateData.status = "expired"
      } else {
        updateData.status = "active"
      }
    }

    // Update employee company
    const { error } = await supabase.from("employee_companies").update(updateData).eq("id", id)

    if (error) {
      console.error("Error updating employee company:", error)

      if (error.message.includes("validate_employee_allocation")) {
        throw new Error(error.message.replace(/^[^:]+: /, ""))
      }

      throw new Error("Failed to update employee company")
    }

    revalidatePath(`/people/employees/${employee_id}`)
    revalidatePath(`/people/employees/${employee_id}/edit`)
  } catch (error) {
    console.error("Error in updateEmployeeCompany:", error)
    throw error
  }
}

// Delete employee company
export async function deleteEmployeeCompany(id: string, employeeId: string): Promise<void> {
  const supabase = createClient()

  // Check if this is the only allocation
  const { count, error: countError } = await supabase
    .from("employee_companies")
    .select("*", { count: "exact", head: true })
    .eq("employee_id", employeeId)

  if (countError) {
    console.error("Error counting employee companies:", countError)
    throw new Error("Failed to check employee companies")
  }

  // Get current allocation to check if it's primary
  const { data: currentAllocation } = await supabase
    .from("employee_companies")
    .select("is_primary")
    .eq("id", id)
    .single()

  // If this is the primary allocation and there are others, prevent deletion
  if (currentAllocation?.is_primary && count > 1) {
    throw new Error(
      "Cannot delete the primary company allocation when other allocations exist. Please set another allocation as primary first.",
    )
  }

  // Delete employee company
  const { error } = await supabase.from("employee_companies").delete().eq("id", id)

  if (error) {
    console.error("Error deleting employee company:", error)
    throw new Error("Failed to delete employee company")
  }

  // If this was the primary allocation, clear the employee's primary company and home branch
  if (currentAllocation?.is_primary) {
    const { error: updateEmployeeError } = await supabase
      .from("employees")
      .update({
        primary_company_id: null,
        home_branch_id: null,
      })
      .eq("id", employeeId)

    if (updateEmployeeError) {
      console.error("Error updating employee after deleting primary company:", updateEmployeeError)
      // We don't throw here to avoid rolling back the deletion
    }
  }

  revalidatePath(`/people/employees/${employeeId}`)
  revalidatePath(`/people/employees/${employeeId}/edit`)
}

// Get departments
export async function getDepartments(): Promise<Department[]> {
  const supabase = createClient()

  try {
    console.log("Fetching departments from database...")
    const { data, error } = await supabase.from("departments").select("*").order("name")

    if (error) {
      console.error("Error fetching departments:", error)
      throw new Error(`Failed to fetch departments: ${error.message}`)
    }

    console.log(`Successfully fetched ${data?.length || 0} departments`)
    return data || []
  } catch (error) {
    console.error("Exception in getDepartments:", error)
    // Return empty array instead of throwing to prevent UI from breaking
    return []
  }
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
