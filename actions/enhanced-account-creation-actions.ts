"use server"

import { pool } from '@/lib/postgresql-client'
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function getEmployeesEnhanced() {
  try {
    console.log("🐘 Fetching employees from PostgreSQL...")

    const client = await pool.connect()
    
    const query = `
      SELECT id, employee_id, first_name, last_name, email, status
      FROM employees
      WHERE status = 'active'
      ORDER BY first_name ASC
    `
    
    const result = await client.query(query)
    client.release()

    console.log(`✅ Retrieved ${result.rows.length} employees from PostgreSQL`)

    // Process employees to include full_name
    const processedEmployees = result.rows.map((employee) => ({
      ...employee,
      full_name:
        `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
        `Employee ${employee.employee_id || employee.id}`,
    }))

    return {
      success: true,
      data: processedEmployees,
    }

  } catch (error: any) {
    console.error("❌ Error fetching employees from PostgreSQL:", error)
    return {
      success: false,
      error: `Failed to fetch employees: ${error.message}`,
      data: [],
    }
  }
}

export async function getRolesEnhanced() {
  try {
    console.log("🐘 Fetching roles from PostgreSQL...")

    const client = await pool.connect()
    
    const query = `
      SELECT id, title, name, description
      FROM roles
      ORDER BY title ASC
    `
    
    const result = await client.query(query)
    client.release()

    console.log(`✅ Retrieved ${result.rows.length} roles from PostgreSQL`)

    // Process roles to standardize the display name
    const processedRoles = result.rows.map((role) => ({
      ...role,
      role_title: role.title || role.name || `Role ${role.id}`,
    }))

    return {
      success: true,
      data: processedRoles,
    }

  } catch (error: any) {
    console.error("❌ Error fetching roles from PostgreSQL:", error)
    return {
      success: false,
      error: `Failed to fetch roles: ${error.message}`,
      data: [],
    }
  }
}

export async function createUserAccountEnhanced({
  employeeId,
  roleId,
  password,
}: {
  employeeId: string
  roleId: string
  password: string
}) {
  try {
    console.log(`🐘 Creating user account for employee ${employeeId}...`)

    const client = await pool.connect()

    // First, get the employee to check if they exist and get their email
    const employeeQuery = `
      SELECT id, employee_id, first_name, last_name, email
      FROM employees
      WHERE id = $1 AND status = 'active'
    `
    
    const employeeResult = await client.query(employeeQuery, [employeeId])
    
    if (employeeResult.rows.length === 0) {
      client.release()
      return {
        success: false,
        error: "Employee not found or not active",
      }
    }

    const employee = employeeResult.rows[0]

    // Check if role exists
    const roleQuery = `SELECT id FROM roles WHERE id = $1`
    const roleResult = await client.query(roleQuery, [roleId])
    
    if (roleResult.rows.length === 0) {
      client.release()
      return {
        success: false,
        error: "Role not found",
      }
    }

    // Check if user account already exists for this employee
    const existingAccountQuery = `
      SELECT id FROM user_accounts WHERE employee_id = $1
    `
    
    const existingResult = await client.query(existingAccountQuery, [employeeId])
    
    if (existingResult.rows.length > 0) {
      client.release()
      return {
        success: false,
        error: "User account already exists for this employee",
      }
    }

    // Generate username from employee data
    const username = employee.email || `${employee.first_name?.toLowerCase() || 'user'}${employee.employee_id || employee.id}`

    // Hash the password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create the user account
    const createAccountQuery = `
      INSERT INTO user_accounts (employee_id, role_id, username, email, password_hash, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `
    
    const now = new Date().toISOString()
    const createValues = [
      employeeId,
      roleId,
      username,
      employee.email,
      passwordHash,
      true,
      now,
      now
    ]
    
    const createResult = await client.query(createAccountQuery, createValues)
    client.release()

    console.log("✅ User account created successfully")

    revalidatePath("/organization/user-accounts")
    revalidatePath("/organization/account-creation")

    return {
      success: true,
      data: createResult.rows[0],
      message: "User account created successfully",
    }

  } catch (error: any) {
    console.error("❌ Error creating user account:", error)
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      return {
        success: false,
        error: "Username or email already exists",
      }
    }
    
    return {
      success: false,
      error: `Failed to create user account: ${error.message}`,
    }
  }
}

export async function checkEmployeesAndRolesExist() {
  try {
    console.log("🐘 Checking if employees and roles exist in PostgreSQL...")

    const client = await pool.connect()

    // Check employees
    const employeeQuery = `SELECT COUNT(*) as count FROM employees WHERE status = 'active'`
    const employeeResult = await client.query(employeeQuery)
    const employeesExist = parseInt(employeeResult.rows[0].count) > 0

    // Check roles  
    const roleQuery = `SELECT COUNT(*) as count FROM roles`
    const roleResult = await client.query(roleQuery)
    const rolesExist = parseInt(roleResult.rows[0].count) > 0

    client.release()

    console.log(`✅ Employees exist: ${employeesExist}, Roles exist: ${rolesExist}`)

    return {
      success: true,
      employeesExist,
      rolesExist,
      error: null,
    }

  } catch (error: any) {
    console.error("❌ Error checking prerequisites:", error)
    return {
      success: false,
      employeesExist: false,
      rolesExist: false,
      error: `Failed to check prerequisites: ${error.message}`,
    }
  }
}

export async function createEnhancedAccountCreationForm() {
  // This function appears to be unused, keeping it as a placeholder
  return {
    success: true,
    message: "Enhanced account creation form created",
  }
}
