"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function getEmployees() {
  try {
    console.log("Fetching employees...")

    // Simplify the query - just get the basic employee data first
    const result = await query(
      `SELECT 
        id,
        employee_id,
        first_name,
        last_name,
        email,
        department_id,
        designation_id,
        status
      FROM employees 
      WHERE status = $1 
      ORDER BY first_name ASC 
      LIMIT 50`,
      ["active"]
    )

    console.log(`Retrieved ${result.rows?.length || 0} employees`, result.rows)

    // Process employees to include full_name
    const processedEmployees = result.rows.map((employee) => ({
      ...employee,
      full_name:
        `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || `Employee ${employee.employee_id}`,
      department_name: "Department", // Simplified for debugging
      designation_name: "Designation", // Simplified for debugging
    }))

    // IMPORTANT: Return all employees for now to debug the issue
    console.log("Returning all employees:", processedEmployees)
    return processedEmployees
  } catch (error) {
    console.error("Error in getEmployees:", error)
    return []
  }
}

export async function getRoles() {
  try {
    console.log("Fetching roles...")

    // Simplify the query to just get basic role data
    const result = await query("SELECT * FROM roles LIMIT 50")

    console.log(`Retrieved ${result.rows?.length || 0} roles`, result.rows)

    // Map roles to ensure consistent structure
    const formattedRoles = result.rows.map((role) => {
      return {
        id: role.id,
        role_title: role.title || `Role ${role.id}`,
        description: role.description || "",
      }
    })

    console.log("Returning formatted roles:", formattedRoles)
    return formattedRoles
  } catch (error) {
    console.error("Error in getRoles:", error)
    return []
  }
}

export async function createUserAccount({
  employeeId,
  roleId,
  password,
}: {
  employeeId: string
  roleId: string
  password: string
}) {
  try {
    console.log(`Updating employee ${employeeId} with role ${roleId} and new password`)

    // Check if employee exists
    const employeeResult = await query(
      "SELECT id, email, first_name, last_name, employee_id FROM employees WHERE id = $1",
      [employeeId]
    )

    if (!employeeResult.rows || employeeResult.rows.length === 0) {
      console.error("Employee not found")
      return { success: false, error: "Employee not found" }
    }

    const employee = employeeResult.rows[0]

    // Create full_name from first_name and last_name
    const full_name = `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
    console.log(`Employee found: ${full_name}`)

    // Check if employee has an email
    if (!employee.email) {
      console.error("Employee has no email address")
      return { success: false, error: "Employee does not have an email address" }
    }

    // Check if employee has an employee_id
    if (!employee.employee_id) {
      console.error("Employee has no employee ID")
      return { success: false, error: "Employee does not have an employee ID" }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Use employee_id as username
    const username = employee.employee_id.toString()

    // Update the employee record with account information
    const updateResult = await query(
      `UPDATE employees 
       SET role_id = $1, 
           password_hash = $2, 
           username = $3, 
           is_active = $4
       WHERE id = $5 
       RETURNING *`,
      [roleId, hashedPassword, username, true, employeeId]
    )

    if (!updateResult.rows || updateResult.rows.length === 0) {
      console.error("Error updating employee account")
      return { success: false, error: "Failed to update employee account" }
    }

    console.log("Account updated successfully")

    // Log the activity if the activities table exists
    try {
      await query(
        `INSERT INTO activities (activity_type, description, performed_by, entity_type, entity_id) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          "account_creation",
          `Account created for ${full_name} with employee ID ${username}`,
          "system",
          "employee",
          employeeId
        ]
      )
    } catch (activityError) {
      console.log("Could not log activity (non-critical error)")
    }

    revalidatePath("/organization/account-creation")
    return { success: true }
  } catch (error) {
    console.error("Error in createUserAccount:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
