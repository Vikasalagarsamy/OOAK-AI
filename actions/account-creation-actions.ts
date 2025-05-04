"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function getEmployees() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("employees")
      .select(`
        id,
        employee_id,
        first_name,
        last_name,
        full_name,
        email,
        department_id,
        departments(name) as department_name,
        designation_id,
        designations(name) as designation_name
      `)
      .order("full_name", { ascending: true })

    if (error) throw error

    // Check if any employees already have accounts
    const { data: userAccounts } = await supabase.from("user_accounts").select("employee_id")

    // Filter out employees who already have accounts
    const employeesWithoutAccounts = data.filter(
      (employee) => !userAccounts?.some((account) => account.employee_id === employee.id),
    )

    return employeesWithoutAccounts
  } catch (error) {
    console.error("Error fetching employees:", error)
    return []
  }
}

export async function getRoles() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("roles").select("*")

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error fetching roles:", error)
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
    // Check if employee exists
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, email, full_name")
      .eq("id", employeeId)
      .single()

    if (employeeError || !employee) {
      return { success: false, error: "Employee not found" }
    }

    // Check if employee has an email
    if (!employee.email) {
      return { success: false, error: "Employee does not have an email address" }
    }

    // Check if account already exists
    const { data: existingAccount, error: accountError } = await supabase
      .from("user_accounts")
      .select("id")
      .eq("employee_id", employeeId)

    if (existingAccount && existingAccount.length > 0) {
      return { success: false, error: "Employee already has an account" }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the user account
    const { data, error } = await supabase
      .from("user_accounts")
      .insert({
        employee_id: employeeId,
        role_id: roleId,
        email: employee.email,
        password_hash: hashedPassword,
        username: employee.email.split("@")[0], // Use part of email as username
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error creating user account:", error)
      return { success: false, error: "Failed to create user account" }
    }

    // Log the activity
    await supabase.from("activities").insert({
      activity_type: "account_creation",
      description: `Account created for ${employee.full_name}`,
      performed_by: "system", // This should be the current user's ID in a real app
      entity_type: "user_account",
      entity_id: data[0].id,
    })

    revalidatePath("/organization/account-creation")
    return { success: true }
  } catch (error) {
    console.error("Error in createUserAccount:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
