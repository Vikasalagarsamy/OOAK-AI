"use server"

import { createClient } from "@/lib/postgresql-unified"
import { revalidatePath } from "next/cache"
import { generateEmployeeId } from "@/utils/employee-id-generator"
import type { EmployeeFormData, EmployeeCompanyFormData } from "@/types/employee"

export async function getEmployees() {
  const { query, transaction } = createClient()

  try {
    console.log("🔍 Fetching all employees with relationships...")
    const result = await query(`
      SELECT 
        e.*,
        d.name as department_name,
        des.name as designation_name,
        b.name as home_branch_name,
        c.name as primary_company_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      LEFT JOIN branches b ON e.home_branch_id = b.id
      LEFT JOIN companies c ON e.primary_company_id = c.id
      ORDER BY e.created_at DESC
    `)

    console.log(`✅ Successfully fetched ${result.rows.length} employees`)
    
    // Transform the data to include the related names
    const transformedData = result.rows.map((employee: any) => ({
      ...employee,
      department_name: employee.department_name || "Not Assigned",
      designation_name: employee.designation_name || "Not Assigned",
      home_branch_name: employee.home_branch_name || "Not Assigned",
      primary_company_name: employee.primary_company_name || "Not Assigned",
    }))

    return transformedData
  } catch (error: any) {
    console.error("❌ Error fetching employees:", error)
    throw new Error(`Error fetching employees: ${error.message}`)
  }
}

export async function getEmployee(id: number) {
  const { query, transaction } = createClient()

  try {
    console.log(`🔍 Fetching employee with ID: ${id}`)
    const result = await query(`
      SELECT 
        e.*,
        d.name as department_name,
        des.name as designation_name,
        b.name as home_branch_name,
        c.name as primary_company_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      LEFT JOIN branches b ON e.home_branch_id = b.id
      LEFT JOIN companies c ON e.primary_company_id = c.id
      WHERE e.id = $1
    `, [id])

    if (result.rows.length === 0) {
      throw new Error(`Employee with ID ${id} not found`)
    }

    console.log(`✅ Successfully fetched employee: ${result.rows[0].first_name} ${result.rows[0].last_name}`)

    // Transform the data to include the related names
    const data = result.rows[0]
    const transformedData = {
      ...data,
      department_name: data.department_name || "Not Assigned",
      designation_name: data.designation_name || "Not Assigned",
      home_branch_name: data.home_branch_name || "Not Assigned",
      primary_company_name: data.primary_company_name || "Not Assigned",
    }

    return transformedData
  } catch (error: any) {
    console.error("❌ Error fetching employee:", error)
    throw new Error(`Error fetching employee: ${error.message}`)
  }
}

export async function getEmployeeCompanies(employeeId: number) {
  const { query, transaction } = createClient()

  try {
    console.log(`🔍 Fetching companies for employee ID: ${employeeId}`)
    const result = await query(`
      SELECT 
        ec.*,
        c.name as company_name,
        b.name as branch_name
      FROM employee_companies ec
      LEFT JOIN companies c ON ec.company_id = c.id
      LEFT JOIN branches b ON ec.branch_id = b.id
      WHERE ec.employee_id = $1
      ORDER BY ec.is_primary DESC
    `, [employeeId])

    console.log(`✅ Successfully fetched ${result.rows.length} company allocations`)

    // Transform the data to include the related names
    const transformedData = result.rows.map((employeeCompany: any) => ({
      ...employeeCompany,
      company_name: employeeCompany.company_name || "Unknown",
      branch_name: employeeCompany.branch_name || "Unknown",
    }))

    return transformedData
  } catch (error: any) {
    console.error("❌ Error fetching employee companies:", error)
    throw new Error(`Error fetching employee companies: ${error.message}`)
  }
}

export async function createEmployee(formData: EmployeeFormData) {
  const { query, transaction } = createClient()

  try {
    console.log(`🔄 Creating new employee: ${formData.first_name} ${formData.last_name}`)
    
    // Generate employee ID
    const employeeId = await generateEmployeeId(formData.primary_company_id, formData.first_name, formData.last_name)

    const result = await transaction(async () => {
      // Insert employee
      const employeeResult = await query(`
        INSERT INTO employees (
          employee_id, first_name, last_name, email, phone, address, city, state, 
          zip_code, country, hire_date, termination_date, status, department_id, 
          designation_id, job_title, home_branch_id, primary_company_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `, [
        employeeId,
        formData.first_name,
        formData.last_name,
        formData.email,
        formData.phone,
        formData.address,
        formData.city,
        formData.state,
        formData.zip_code,
        formData.country,
        formData.hire_date || new Date().toISOString().split('T')[0],
        formData.termination_date || null,
        formData.status,
        formData.department_id,
        formData.designation_id,
        formData.job_title,
        formData.home_branch_id,
        formData.primary_company_id
      ])

      const newEmployee = employeeResult.rows[0]

      // Create primary company allocation (100%)
      await query(`
        INSERT INTO employee_companies (
          employee_id, company_id, branch_id, allocation_percentage, is_primary
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        newEmployee.id,
        formData.primary_company_id,
        formData.home_branch_id || null,
        100,
        true
      ])

      console.log(`✅ Successfully created employee with ID: ${newEmployee.id}`)
      return newEmployee
    })

    revalidatePath("/people/employees")
    return { success: true, data: result }
  } catch (error: any) {
    console.error("❌ Error creating employee:", error)
    return { success: false, error: error.message }
  }
}

export async function updateEmployee(id: number, formData: EmployeeFormData) {
  const { query, transaction } = createClient()

  try {
    console.log(`🔄 Updating employee ID: ${id}`)

    const result = await transaction(async () => {
      // Update employee
      const employeeResult = await query(`
        UPDATE employees SET
          first_name = $1, last_name = $2, email = $3, phone = $4, address = $5,
          city = $6, state = $7, zip_code = $8, country = $9, hire_date = $10,
          termination_date = $11, status = $12, department_id = $13, designation_id = $14,
          job_title = $15, home_branch_id = $16, primary_company_id = $17
        WHERE id = $18
        RETURNING *
      `, [
        formData.first_name,
        formData.last_name,
        formData.email,
        formData.phone,
        formData.address,
        formData.city,
        formData.state,
        formData.zip_code,
        formData.country,
        formData.hire_date || new Date().toISOString().split('T')[0],
        formData.termination_date || null,
        formData.status,
        formData.department_id,
        formData.designation_id,
        formData.job_title,
        formData.home_branch_id,
        formData.primary_company_id,
        id
      ])

      const updatedEmployee = employeeResult.rows[0]

      // Get current primary company
      const primaryCompanyResult = await query(`
        SELECT * FROM employee_companies 
        WHERE employee_id = $1 AND is_primary = true
      `, [id])

      const primaryCompany = primaryCompanyResult.rows[0]

      if (primaryCompany && primaryCompany.company_id !== formData.primary_company_id) {
        // Update primary company if changed
        await query(`
          UPDATE employee_companies SET
            company_id = $1, branch_id = $2
          WHERE employee_id = $3 AND is_primary = true
        `, [
          formData.primary_company_id,
          formData.home_branch_id || null,
          id
        ])
      }

      console.log(`✅ Successfully updated employee ID: ${id}`)
      return updatedEmployee
    })

    revalidatePath("/people/employees")
    return { success: true, data: result }
  } catch (error: any) {
    console.error("❌ Error updating employee:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteEmployee(id: number) {
  const { query, transaction } = createClient()

  try {
    console.log(`🗑️ Deleting employee ID: ${id}`)

    await transaction(async () => {
      // Delete employee company allocations first
      await query(`DELETE FROM employee_companies WHERE employee_id = $1`, [id])
      
      // Delete employee
      await query(`DELETE FROM employees WHERE id = $1`, [id])
    })

    console.log(`✅ Successfully deleted employee ID: ${id}`)
    revalidatePath("/people/employees")
    return { success: true }
  } catch (error: any) {
    console.error("❌ Error deleting employee:", error)
    return { success: false, error: error.message }
  }
}

export async function addEmployeeCompany(employeeId: number, formData: EmployeeCompanyFormData) {
  const { query, transaction } = createClient()

  try {
    console.log(`🔄 Adding company allocation for employee ID: ${employeeId}`)

    await transaction(async () => {
      // If this is marked as primary, unset other primary allocations
      if (formData.is_primary) {
        await query(`
          UPDATE employee_companies 
          SET is_primary = false 
          WHERE employee_id = $1
        `, [employeeId])
      }

      // Insert new allocation
      await query(`
        INSERT INTO employee_companies (
          employee_id, company_id, branch_id, allocation_percentage, is_primary
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        employeeId,
        formData.company_id,
        formData.branch_id || null,
        formData.allocation_percentage,
        formData.is_primary
      ])
    })

    console.log(`✅ Successfully added company allocation for employee ID: ${employeeId}`)
    revalidatePath("/people/employees")
    return { success: true }
  } catch (error: any) {
    console.error("❌ Error adding employee company:", error)
    return { success: false, error: error.message }
  }
}

export async function removeEmployeeCompany(allocationId: string, employeeId: number) {
  const { query, transaction } = createClient()

  try {
    console.log(`🗑️ Removing company allocation ID: ${allocationId}`)

    await query(`DELETE FROM employee_companies WHERE id = $1`, [allocationId])

    console.log(`✅ Successfully removed company allocation ID: ${allocationId}`)
    revalidatePath("/people/employees")
    return { success: true }
  } catch (error: any) {
    console.error("❌ Error removing employee company:", error)
    return { success: false, error: error.message }
  }
}

export async function getDepartments() {
  const { query, transaction } = createClient()

  try {
    console.log("🔍 Fetching all departments...")
    const result = await query(`SELECT * FROM departments ORDER BY name`)
    
    console.log(`✅ Successfully fetched ${result.rows.length} departments`)
    return result.rows
  } catch (error: any) {
    console.error("❌ Error fetching departments:", error)
    throw new Error(`Error fetching departments: ${error.message}`)
  }
}

export async function getDesignations() {
  const { query, transaction } = createClient()

  try {
    console.log("🔍 Fetching all designations...")
    const result = await query(`SELECT * FROM designations ORDER BY name`)
    
    console.log(`✅ Successfully fetched ${result.rows.length} designations`)
    return result.rows
  } catch (error: any) {
    console.error("❌ Error fetching designations:", error)
    throw new Error(`Error fetching designations: ${error.message}`)
  }
}

export async function getBranches() {
  const { query, transaction } = createClient()

  try {
    console.log("🔍 Fetching all branches...")
    const result = await query(`SELECT * FROM branches ORDER BY name`)
    
    console.log(`✅ Successfully fetched ${result.rows.length} branches`)
    return result.rows
  } catch (error: any) {
    console.error("❌ Error fetching branches:", error)
    throw new Error(`Error fetching branches: ${error.message}`)
  }
}

export async function getCompanies() {
  const { query, transaction } = createClient()

  try {
    console.log("🔍 Fetching all companies...")
    const result = await query(`SELECT * FROM companies ORDER BY name`)
    
    console.log(`✅ Successfully fetched ${result.rows.length} companies`)
    return result.rows
  } catch (error: any) {
    console.error("❌ Error fetching companies:", error)
    throw new Error(`Error fetching companies: ${error.message}`)
  }
}
