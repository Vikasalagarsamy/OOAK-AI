"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function getEmployees() {
  const supabase = createClient()

  try {
    console.log("Fetching employees...")

    // Simplify the query - just get the basic employee data first
    const { data, error } = await supabase
      .from("employees")
      .select(`
        id,
        employee_id,
        first_name,
        last_name,
        email,
        department_id,
        designation_id,
        status
      `)
      .eq("status", "active")
      .order("first_name", { ascending: true })
      .limit(50)

    if (error) {
      console.error("Error fetching employees:", error)
      throw error
    }

    console.log(`Retrieved ${data?.length || 0} employees`, data)

    // Process employees to include full_name
    const processedEmployees = data.map((employee) => ({
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
  const supabase = createClient()

  try {
    console.log("Fetching roles...")

    // Simplify the query to just get basic role data
    const { data, error } = await supabase.from("roles").select("*").limit(50)

    if (error) {
      console.error("Error fetching roles:", error)
      throw error
    }

    console.log(`Retrieved ${data?.length || 0} roles`, data)

    // Map roles to ensure consistent structure
    const formattedRoles = data.map((role) => {
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
  const supabase = createClient()

  try {
    console.log(`Creating account for employee ${employeeId} with role ${roleId}`)

    // Check if employee exists
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, email, first_name, last_name")
      .eq("id", employeeId)
      .single()

    if (employeeError || !employee) {
      console.error("Employee not found:", employeeError)
      return { success: false, error: "Employee not found" }
    }

    // Create full_name from first_name and last_name
    const full_name = `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
    console.log(`Employee found: ${full_name}`)

    // Check if employee has an email
    if (!employee.email) {
      console.error("Employee has no email address")
      return { success: false, error: "Employee does not have an email address" }
    }

    // Check if employee already has an account
    try {
      const { data: existingAccount, error: accountError } = await supabase
        .from("user_accounts")
        .select("id")
        .eq("employee_id", employeeId)

      if (!accountError && existingAccount && existingAccount.length > 0) {
        console.error("Employee already has an account")
        return { success: false, error: "Employee already has an account" }
      }
    } catch (error) {
      console.error("Error checking for existing account:", error)
      // Continue anyway, the unique constraint will catch duplicates
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate a username if email doesn't have a username part
    const username = employee.email.includes("@") ? employee.email.split("@")[0] : `user_${employee.id}`

    // Create the user account
    const { data, error } = await supabase
      .from("user_accounts")
      .insert({
        employee_id: employeeId,
        role_id: roleId,
        email: employee.email,
        password_hash: hashedPassword,
        username: username,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error creating user account:", error)
      return { success: false, error: "Failed to create user account: " + error.message }
    }

    console.log("Account created successfully")

    // Log the activity if the activities table exists
    try {
      await supabase.from("activities").insert({
        activity_type: "account_creation",
        description: `Account created for ${full_name}`,
        performed_by: "system",
        entity_type: "user_account",
        entity_id: data[0].id,
      })
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
