"use server"

import { query, transaction } from "@/lib/postgresql-client"
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
  try {
    console.log('👥 [EMPLOYEES] Fetching employees via PostgreSQL...')

    const result = await query(`
      SELECT 
        e.*,
        d.name as department_name,
        des.name as designation_name,
        b.name as branch_name,
        c.name as company_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      LEFT JOIN branches b ON e.home_branch_id = b.id
      LEFT JOIN companies c ON e.primary_company_id = c.id
      ORDER BY e.created_at DESC
    `)

    // Transform the data to include the related names
    const transformedData = result.rows.map((employee) => ({
      ...employee,
      departments: employee.department_name ? { name: employee.department_name } : null,
      designations: employee.designation_name ? { name: employee.designation_name } : null,
      branches: employee.branch_name ? { name: employee.branch_name } : null,
      companies: employee.company_name ? { name: employee.company_name } : null,
      department_name: employee.department_name || "Not Assigned",
      designation_name: employee.designation_name || "Not Assigned",
      home_branch_name: employee.branch_name || "Not Assigned",
      primary_company_name: employee.company_name || "Not Assigned",
    }))

    console.log(`✅ [EMPLOYEES] Fetched ${transformedData.length} employees via PostgreSQL`)
    return transformedData
  } catch (error) {
    console.error("❌ [EMPLOYEES] Error fetching employees:", error)
    throw new Error(`Error fetching employees: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getEmployee(id: string | number) {
  try {
    console.log(`👤 [EMPLOYEES] Fetching employee ${id} via PostgreSQL...`)

    // Validate that id is a number
    const numericId = typeof id === "string" ? Number.parseInt(id) : id

    if (isNaN(numericId)) {
      throw new Error(`Invalid employee ID: ${id}`)
    }

    const result = await query(`
      SELECT 
        e.*,
        d.name as department_name,
        des.name as designation_name,
        b.name as branch_name,
        c.name as company_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      LEFT JOIN branches b ON e.home_branch_id = b.id
      LEFT JOIN companies c ON e.primary_company_id = c.id
      WHERE e.id = $1
    `, [numericId])

    if (result.rows.length === 0) {
      throw new Error(`Employee with ID ${id} not found`)
    }

    const employee = result.rows[0]

    // Transform the data to include the related names
    const transformedData = {
      ...employee,
      departments: employee.department_name ? { name: employee.department_name } : null,
      designations: employee.designation_name ? { name: employee.designation_name } : null,
      branches: employee.branch_name ? { name: employee.branch_name } : null,
      companies: employee.company_name ? { name: employee.company_name } : null,
      department_name: employee.department_name || "Not Assigned",
      designation_name: employee.designation_name || "Not Assigned",
      home_branch_name: employee.branch_name || "Not Assigned",
      primary_company_name: employee.company_name || "Not Assigned",
    }

    console.log(`✅ [EMPLOYEES] Fetched employee ${id} via PostgreSQL`)
    return transformedData
  } catch (error) {
    console.error(`❌ [EMPLOYEES] Error fetching employee ${id}:`, error)
    throw new Error(`Error fetching employee: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getEmployeeCompanies(employeeId: string): Promise<EmployeeCompany[]> {
  try {
    console.log(`🏢 [EMPLOYEES] Fetching employee companies for ${employeeId} via PostgreSQL...`)

    const result = await query(`
      SELECT 
        ec.id,
        ec.employee_id,
        ec.company_id,
        ec.branch_id,
        ec.allocation_percentage,
        ec.is_primary,
        c.name as company_name,
        b.name as branch_name
      FROM employee_companies ec
      LEFT JOIN companies c ON ec.company_id = c.id
      LEFT JOIN branches b ON ec.branch_id = b.id
      WHERE ec.employee_id = $1
    `, [employeeId])

    // Transform the data to match the EmployeeCompany type
    const transformedData: EmployeeCompany[] = result.rows.map((item) => ({
      id: item.id,
      employee_id: item.employee_id,
      company_id: item.company_id,
      branch_id: item.branch_id,
      company_name: item.company_name || "Unknown Company",
      branch_name: item.branch_name || "Unknown Branch",
      allocation_percentage: item.allocation_percentage || 0,
      is_primary: item.is_primary || false,
    }))

    console.log(`✅ [EMPLOYEES] Fetched ${transformedData.length} employee companies via PostgreSQL`)
    return transformedData
  } catch (error) {
    console.error(`❌ [EMPLOYEES] Error fetching employee companies for ${employeeId}:`, error)
    throw error
  }
}

export async function createEmployee(formData: FormData) {
  try {
    console.log('👤 [EMPLOYEES] Creating new employee via PostgreSQL...')

    // Generate employee ID
    const employeeId = await generateEmployeeIdUtil()

    // Use transaction for atomic employee creation
    const result = await transaction(async (client) => {
      // Insert employee using PostgreSQL
      const employeeResult = await client.query(`
        INSERT INTO employees (
          employee_id, first_name, last_name, email, phone, address, city, state, 
          zip_code, country, hire_date, termination_date, status, department_id, 
          designation_id, job_title, home_branch_id, primary_company_id, created_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
        RETURNING *
      `, [
        employeeId,
        formData.get("first_name"),
        formData.get("last_name"),
        formData.get("email"),
        formData.get("phone"),
        formData.get("address"),
        formData.get("city"),
        formData.get("state"),
        formData.get("zip_code"),
        formData.get("country"),
        formData.get("hire_date"),
        formData.get("termination_date") || null,
        formData.get("status"),
        formData.get("department_id") ? Number.parseInt(formData.get("department_id") as string) : null,
        formData.get("designation_id") ? Number.parseInt(formData.get("designation_id") as string) : null,
        formData.get("job_title"),
        formData.get("home_branch_id") ? Number.parseInt(formData.get("home_branch_id") as string) : null,
        formData.get("primary_company_id") ? Number.parseInt(formData.get("primary_company_id") as string) : null,
        new Date().toISOString()
      ])

      const employee = employeeResult.rows[0]

      // Create primary company allocation (100%)
      await client.query(`
        INSERT INTO employee_companies (
          employee_id, company_id, branch_id, allocation_percentage, is_primary, created_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        employee.id,
        formData.get("primary_company_id") ? Number.parseInt(formData.get("primary_company_id") as string) : null,
        formData.get("home_branch_id") ? Number.parseInt(formData.get("home_branch_id") as string) : null,
        100,
        true,
        new Date().toISOString()
      ])

      return employee
    })

    revalidatePath("/people/employees")
    console.log(`✅ [EMPLOYEES] Employee created successfully: ${result.employee_id}`)
    return { success: true, data: result }
  } catch (error: any) {
    console.error("❌ [EMPLOYEES] Error creating employee:", error)
    return { success: false, error: error.message }
  }
}

export async function updateEmployee(id: string, formData: FormData) {
  try {
    console.log(`📝 [EMPLOYEES] Updating employee ${id} via PostgreSQL...`)

    // Use transaction for atomic employee update
    const result = await transaction(async (client) => {
      // Update employee with proper null handling using PostgreSQL
      const employeeResult = await client.query(`
        UPDATE employees 
        SET 
          first_name = $1, last_name = $2, email = $3, phone = $4, address = $5, 
          city = $6, state = $7, zip_code = $8, country = $9, hire_date = $10, 
          termination_date = $11, status = $12, department_id = $13, designation_id = $14, 
          job_title = $15, home_branch_id = $16, primary_company_id = $17, updated_at = $18
        WHERE id = $19 
        RETURNING *
      `, [
        formData.get("first_name") || null,
        formData.get("last_name") || null,
        formData.get("email") || null,
        formData.get("phone") || null,
        formData.get("address") || null,
        formData.get("city") || null,
        formData.get("state") || null,
        formData.get("zip_code") || null,
        formData.get("country") || null,
        formData.get("hire_date") || null,
        formData.get("termination_date") || null,
        formData.get("status") || null,
        formData.get("department_id") ? Number.parseInt(formData.get("department_id") as string) : null,
        formData.get("designation_id") ? Number.parseInt(formData.get("designation_id") as string) : null,
        formData.get("job_title") || null,
        formData.get("home_branch_id") ? Number.parseInt(formData.get("home_branch_id") as string) : null,
        formData.get("primary_company_id") ? Number.parseInt(formData.get("primary_company_id") as string) : null,
        new Date().toISOString(),
        id
      ])

      const employee = employeeResult.rows[0]

      // Check if primary company needs updating
      const primaryCompanyResult = await client.query(`
        SELECT * FROM employee_companies 
        WHERE employee_id = $1 AND is_primary = true
      `, [id])

      const newPrimaryCompanyId = formData.get("primary_company_id") 
        ? Number.parseInt(formData.get("primary_company_id") as string) 
        : null

      if (primaryCompanyResult.rows.length > 0) {
        const primaryCompany = primaryCompanyResult.rows[0]
        
        if (primaryCompany.company_id !== newPrimaryCompanyId) {
          await client.query(`
            UPDATE employee_companies 
            SET 
              company_id = $1, 
              branch_id = $2, 
              updated_at = $3
            WHERE id = $4
          `, [
            newPrimaryCompanyId,
            formData.get("home_branch_id") ? Number.parseInt(formData.get("home_branch_id") as string) : null,
            new Date().toISOString(),
            primaryCompany.id
          ])
        }
      }

      return employee
    })

    revalidatePath(`/people/employees/${id}`)
    revalidatePath("/people/employees")
    console.log(`✅ [EMPLOYEES] Employee ${id} updated successfully`)
    return { success: true, data: result }
  } catch (error: any) {
    console.error(`❌ [EMPLOYEES] Error updating employee ${id}:`, error)
    return { success: false, error: error.message }
  }
}

export async function deleteEmployee(id: string) {
  try {
    console.log(`🗑️ [EMPLOYEES] Deleting employee ${id} via PostgreSQL...`)

    // Use transaction for atomic deletion
    await transaction(async (client) => {
      // Delete employee companies first (foreign key constraint)
      await client.query(`DELETE FROM employee_companies WHERE employee_id = $1`, [id])

      // Delete employee
      await client.query(`DELETE FROM employees WHERE id = $1`, [id])
    })

    revalidatePath("/people/employees")
    console.log(`✅ [EMPLOYEES] Employee ${id} deleted successfully`)
    return { success: true }
  } catch (error: any) {
    console.error(`❌ [EMPLOYEES] Error deleting employee ${id}:`, error)
    return { success: false, error: error.message }
  }
}

export async function addEmployeeCompany(employeeId: number | string, formData: FormData) {
  try {
    console.log(`🏢 [EMPLOYEE COMPANIES] Adding company allocation for employee ${employeeId} via PostgreSQL...`)

    // Convert employeeId to number if it's a string
    const numericEmployeeId = typeof employeeId === "string" ? Number.parseInt(employeeId, 10) : employeeId

    return await transaction(async (client) => {
      // Check if total allocation would exceed 100%
      const existingAllocationsResult = await client.query(`
        SELECT allocation_percentage, company_id, branch_id
        FROM employee_companies
        WHERE employee_id = $1
      `, [numericEmployeeId])
      
      const existingAllocations = existingAllocationsResult.rows

      const companyId = formData.get("company_id") ? Number.parseInt(formData.get("company_id") as string) : null
      const branchId = formData.get("branch_id") ? Number.parseInt(formData.get("branch_id") as string) : null

      // Calculate total existing allocation, excluding the company-branch we're adding/updating
      const totalExistingAllocation =
        existingAllocations
          ?.filter((item: any) => !(item.company_id === companyId && item.branch_id === branchId))
          .reduce((sum: number, item: any) => sum + (item.allocation_percentage || 0), 0) || 0

      const newAllocationPercentage = Number.parseInt(formData.get("allocation_percentage") as string)

      if (totalExistingAllocation + newAllocationPercentage > 100) {
        throw new Error(
          `Total allocation would exceed 100%. Current total: ${totalExistingAllocation}%, Trying to add: ${newAllocationPercentage}%, Available: ${100 - totalExistingAllocation}%`,
        )
      }

      // Check if this company-branch combination already exists for this employee
      const existingAllocationResult = await client.query(`
        SELECT * FROM employee_companies
        WHERE employee_id = $1 AND company_id = $2 AND branch_id = $3
      `, [numericEmployeeId, companyId, branchId])

      // Prepare the data object
      const baseData = {
        employee_id: numericEmployeeId,
        company_id: companyId,
        branch_id: branchId,
        allocation_percentage: newAllocationPercentage,
        is_primary: formData.get("is_primary") === "true",
      }

      // Check if the table has additional columns by querying information schema
      const columnsResult = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'employee_companies'
        AND column_name IN ('start_date', 'end_date', 'project_id')
      `)

      // Create a map of column existence
      const columnExists = {
        start_date: columnsResult.rows.some((col: any) => col.column_name === "start_date"),
        end_date: columnsResult.rows.some((col: any) => col.column_name === "end_date"),
        project_id: columnsResult.rows.some((col: any) => col.column_name === "project_id"),
      }

      // Build dynamic SQL based on available columns
      let insertColumns = ['employee_id', 'company_id', 'branch_id', 'allocation_percentage', 'is_primary', 'created_at']
      let insertValues = [numericEmployeeId, companyId, branchId, newAllocationPercentage, baseData.is_primary, 'NOW()']
      let placeholders = ['$1', '$2', '$3', '$4', '$5', 'NOW()']

      if (columnExists.start_date && formData.get("start_date")) {
        insertColumns.push('start_date')
        insertValues.push(formData.get("start_date") as string)
        placeholders.push(`$${insertValues.length}`)
      }

      if (columnExists.end_date && formData.get("end_date")) {
        insertColumns.push('end_date')
        insertValues.push(formData.get("end_date") as string)
        placeholders.push(`$${insertValues.length}`)
      }

      if (columnExists.project_id && formData.get("project_id")) {
        insertColumns.push('project_id')
        insertValues.push(Number.parseInt(formData.get("project_id") as string))
        placeholders.push(`$${insertValues.length}`)
      }

      let result

      if (existingAllocationResult.rows.length > 0) {
        // Update existing allocation
        const existingAllocation = existingAllocationResult.rows[0]
        const updateResult = await client.query(`
          UPDATE employee_companies 
          SET 
            allocation_percentage = $1,
            is_primary = $2,
            updated_at = NOW()
          WHERE id = $3
          RETURNING *
        `, [newAllocationPercentage, baseData.is_primary, existingAllocation.id])
        
        result = { data: updateResult.rows[0] }
      } else {
        // Insert new allocation - fix the placeholder numbering
        const finalPlaceholders = placeholders.map((_, index) => `$${index + 1}`)
        const insertSQL = `
          INSERT INTO employee_companies (${insertColumns.join(', ')})
          VALUES (${finalPlaceholders.join(', ')})
          RETURNING *
        `
        
        const insertResult = await client.query(insertSQL, insertValues.slice(0, -1).concat([new Date().toISOString()]))
        result = { data: insertResult.rows[0] }
      }

      // If this is the primary company, update employee record
      if (formData.get("is_primary") === "true") {
        // Update all other companies to not be primary
        await client.query(`
          UPDATE employee_companies 
          SET is_primary = false, updated_at = NOW()
          WHERE employee_id = $1 AND id != $2
        `, [numericEmployeeId, result.data.id])

        // Update employee record
        await client.query(`
          UPDATE employees
          SET 
            primary_company_id = $1,
            home_branch_id = $2,
            updated_at = NOW()
          WHERE id = $3
        `, [companyId, branchId, numericEmployeeId])
      }

      revalidatePath(`/people/employees/${numericEmployeeId}`)
      revalidatePath(`/people/employees/${numericEmployeeId}/edit`)
      console.log(`✅ [EMPLOYEE COMPANIES] Company allocation managed successfully for employee ${numericEmployeeId}`)
      return { success: true, data: result.data }
    })
  } catch (error: any) {
    console.error("❌ [EMPLOYEE COMPANIES] Error managing employee company:", error)
    return { success: false, error: error.message }
  }
}

export async function removeEmployeeCompany(employeeId: string, companyId: string) {
  try {
    console.log(`🗑️ [EMPLOYEE COMPANIES] Removing company allocation for employee ${employeeId} via PostgreSQL...`)

    return await transaction(async (client) => {
      // Check if this is the primary company
      const companyResult = await client.query(`
        SELECT is_primary FROM employee_companies
        WHERE employee_id = $1 AND company_id = $2
      `, [employeeId, companyId])

      if (companyResult.rows.length === 0) {
        throw new Error("Employee company allocation not found")
      }

      if (companyResult.rows[0].is_primary) {
        throw new Error("Cannot remove primary company. Please assign a different primary company first.")
      }

      // Delete the company allocation
      await client.query(`
        DELETE FROM employee_companies
        WHERE employee_id = $1 AND company_id = $2
      `, [employeeId, companyId])

      revalidatePath(`/people/employees/${employeeId}`)
      console.log(`✅ [EMPLOYEE COMPANIES] Company allocation removed successfully`)
      return { success: true }
    })
  } catch (error: any) {
    console.error("❌ [EMPLOYEE COMPANIES] Error removing employee company:", error)
    return { success: false, error: error.message }
  }
}

export async function getDepartments() {
  try {
    console.log('🏢 [DEPARTMENTS] Fetching departments via PostgreSQL...')

    const result = await query(`
      SELECT id, name, created_at
      FROM departments 
      ORDER BY name
    `)

    console.log(`✅ [DEPARTMENTS] Fetched ${result.rows.length} departments successfully`)
    return result.rows
  } catch (error: any) {
    console.error("❌ [DEPARTMENTS] Error fetching departments:", error)
    throw new Error(`Error fetching departments: ${error.message}`)
  }
}

export async function getDesignations() {
  try {
    console.log('🎯 [DESIGNATIONS] Fetching designations via PostgreSQL...')

    const result = await query(`
      SELECT id, name, created_at
      FROM designations 
      ORDER BY name
    `)

    console.log(`✅ [DESIGNATIONS] Fetched ${result.rows.length} designations successfully`)
    return result.rows
  } catch (error: any) {
    console.error("❌ [DESIGNATIONS] Error fetching designations:", error)
    throw new Error(`Error fetching designations: ${error.message}`)
  }
}

export async function getCompanies() {
  try {
    console.log('🏢 [COMPANIES] Fetching companies via PostgreSQL...')

    const result = await query(`
      SELECT id, name, company_code, location, created_at
      FROM companies 
      ORDER BY name
    `)

    console.log(`✅ [COMPANIES] Fetched ${result.rows.length} companies successfully`)
    return result.rows
  } catch (error: any) {
    console.error("❌ [COMPANIES] Error fetching companies:", error)
    throw new Error(`Error fetching companies: ${error.message}`)
  }
}

export async function getBranchesByCompany(companyId: number): Promise<Branch[]> {
  try {
    console.log(`🏪 [BRANCHES] Fetching branches for company ${companyId} via PostgreSQL...`)

    const result = await query(`
      SELECT id, name, company_id, location, created_at
      FROM branches 
      WHERE company_id = $1 
      ORDER BY name
    `, [companyId])

    console.log(`✅ [BRANCHES] Fetched ${result.rows.length} branches for company ${companyId}`)
    return result.rows
  } catch (error: any) {
    console.error(`❌ [BRANCHES] Error fetching branches for company ${companyId}:`, error)
    throw new Error("Failed to fetch branches")
  }
}

export async function getBranches() {
  try {
    console.log('🏪 [BRANCHES] Fetching all branches via PostgreSQL...')

    const result = await query(`
      SELECT id, name, company_id, location, created_at
      FROM branches 
      ORDER BY name
    `)

    console.log(`✅ [BRANCHES] Fetched ${result.rows.length} branches successfully`)
    return result.rows
  } catch (error: any) {
    console.error("❌ [BRANCHES] Error fetching branches:", error)
    throw new Error(`Error fetching branches: ${error.message}`)
  }
}

export async function updateEmployeeCompany(id: string, formData: FormData) {
  try {
    console.log(`📝 [EMPLOYEE COMPANIES] Updating employee company allocation ${id} via PostgreSQL...`)

    const updateResult = await query(`
      UPDATE employee_companies
      SET 
        branch_id = $1,
        allocation_percentage = $2,
        is_primary = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [
      formData.get("branch_id") ? Number.parseInt(formData.get("branch_id") as string) : null,
      Number.parseInt(formData.get("allocation_percentage") as string),
      formData.get("is_primary") === "true",
      id
    ])

    if (updateResult.rows.length === 0) {
      throw new Error("Employee company allocation not found")
    }

    revalidatePath(`/people/employees/${id}`)
    console.log(`✅ [EMPLOYEE COMPANIES] Employee company allocation updated successfully`)
    return { success: true }
  } catch (error: any) {
    console.error("❌ [EMPLOYEE COMPANIES] Error updating employee company:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteEmployeeCompany(
  id: string,
  employeeId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🗑️ [EMPLOYEE COMPANIES] Deleting employee company allocation ${id} via PostgreSQL...`)

    // Delete employee company
    const deleteResult = await query(`
      DELETE FROM employee_companies WHERE id = $1 RETURNING id
    `, [id])

    if (deleteResult.rows.length === 0) {
      return { success: false, error: "Employee company allocation not found" }
    }

    revalidatePath(`/people/employees/${employeeId}`)
    console.log(`✅ [EMPLOYEE COMPANIES] Employee company allocation deleted successfully`)
    return { success: true }
  } catch (error: any) {
    console.error("❌ [EMPLOYEE COMPANIES] Error deleting employee company:", error)
    return { success: false, error: error.message }
  }
}

// Add the missing exports as identified in the error message

// Set primary company function
export async function setPrimaryCompany(employeeId: string, allocationId: string): Promise<void> {
  try {
    console.log(`⭐ [EMPLOYEE COMPANIES] Setting primary company for employee ${employeeId} via PostgreSQL...`)

    await transaction(async (client) => {
      // First get the allocation details to update the employee's primary company and branch
      const allocationResult = await client.query(`
        SELECT * FROM employee_companies WHERE id = $1
      `, [allocationId])

      if (allocationResult.rows.length === 0) {
        throw new Error("Allocation not found")
      }

      const allocation = allocationResult.rows[0]

      // Update all employee allocations to not be primary
      await client.query(`
        UPDATE employee_companies
        SET is_primary = false, updated_at = NOW()
        WHERE employee_id = $1
      `, [employeeId])

      // Set the selected allocation as primary
      await client.query(`
        UPDATE employee_companies
        SET is_primary = true, updated_at = NOW()
        WHERE id = $1
      `, [allocationId])

      // Update the employee's primary company and home branch
      await client.query(`
        UPDATE employees
        SET 
          primary_company_id = $1,
          home_branch_id = $2,
          updated_at = NOW()
        WHERE id = $3
      `, [allocation.company_id, allocation.branch_id, employeeId])
    })

    revalidatePath(`/people/employees/${employeeId}`)
    revalidatePath(`/people/employees/${employeeId}/edit`)
    revalidatePath("/people/employees")
    console.log(`✅ [EMPLOYEE COMPANIES] Primary company set successfully`)
  } catch (error) {
    console.error("❌ [EMPLOYEE COMPANIES] Error setting primary company:", error)
    throw error
  }
}

// Get projects by company function
export async function getProjectsByCompany(companyId: number) {
  try {
    console.log(`🚀 [PROJECTS] Fetching projects for company ${companyId} via PostgreSQL...`)

    // Check if projects table exists
    const tableExistsResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'projects' AND table_schema = 'public'
    `)

    if (tableExistsResult.rows.length === 0) {
      console.log("⚠️ [PROJECTS] Projects table does not exist, returning empty array")
      return []
    }

    // If table exists, query the projects
    const result = await query(`
      SELECT id, name FROM projects 
      WHERE company_id = $1 
      ORDER BY name
    `, [companyId])

    console.log(`✅ [PROJECTS] Fetched ${result.rows.length} projects for company ${companyId}`)
    return result.rows
  } catch (error) {
    console.error("❌ [PROJECTS] Error in getProjectsByCompany:", error)
    return []
  }
}

export const generateEmployeeId = generateEmployeeIdUtil

// Export aliases for backward compatibility
export const getEmployeeById = getEmployee

