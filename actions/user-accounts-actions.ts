"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type UserAccount = {
  id: number
  username: string
  email: string
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
  employee_id: number
  role_id: number
  employee_name: string
  role_title: string
}

export async function getUserAccounts() {
  const supabase = createClient()

  try {
    console.log("Fetching user accounts...")

    // First, try a simple query to check if the table exists and has data
    const { data: accountsCheck, error: checkError } = await supabase.from("user_accounts").select("id").limit(1)

    if (checkError) {
      console.error("Error checking user_accounts table:", checkError)
      return {
        data: [],
        error: "The user accounts table hasn't been created yet. Please create user accounts first.",
      }
    }

    // If we get here, the table exists, but we need to handle the relationships carefully
    // Instead of using foreign key relationships in the query, let's do separate queries

    // Get all user accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("user_accounts")
      .select("*")
      .order("created_at", { ascending: false })

    if (accountsError) {
      console.error("Error fetching user accounts:", accountsError)
      return {
        data: [],
        error: `Failed to retrieve user accounts: ${accountsError.message}`,
      }
    }

    // If we have no accounts, return early
    if (!accounts || accounts.length === 0) {
      return { data: [], error: null }
    }

    // Get all employees and roles in separate queries
    const employeeIds = accounts.map((account) => account.employee_id)
    const roleIds = accounts.map((account) => account.role_id)

    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, first_name, last_name, employee_id")
      .in("id", employeeIds)

    if (employeesError) {
      console.error("Error fetching employees:", employeesError)
      // Continue anyway, we'll just show IDs instead of names
    }

    const { data: roles, error: rolesError } = await supabase.from("roles").select("id, title").in("id", roleIds)

    if (rolesError) {
      console.error("Error fetching roles:", rolesError)
      // Continue anyway, we'll just show IDs instead of titles
    }

    // Create lookup maps for employees and roles
    const employeeMap = new Map()
    if (employees) {
      employees.forEach((employee) => {
        employeeMap.set(employee.id, employee)
      })
    }

    const roleMap = new Map()
    if (roles) {
      roles.forEach((role) => {
        roleMap.set(role.id, role)
      })
    }

    // Process data to format it for display
    const processedAccounts = accounts.map((account) => {
      const employee = employeeMap.get(account.employee_id) || {}
      const role = roleMap.get(account.role_id) || {}

      return {
        id: account.id,
        username: account.username,
        email: account.email,
        is_active: account.is_active,
        last_login: account.last_login,
        created_at: account.created_at,
        updated_at: account.updated_at,
        employee_id: account.employee_id,
        role_id: account.role_id,
        employee_name:
          employee.first_name && employee.last_name
            ? `${employee.first_name} ${employee.last_name}`
            : employee.employee_id
              ? `Employee ${employee.employee_id}`
              : `Employee ID: ${account.employee_id}`,
        role_title: role.title || `Role ID: ${account.role_id}`,
      }
    })

    return { data: processedAccounts, error: null }
  } catch (error) {
    console.error("Error in getUserAccounts:", error)
    return { data: [], error: "An unexpected error occurred while fetching user accounts" }
  }
}

export async function toggleAccountStatus(accountId: string, isActive: boolean) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("user_accounts")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", accountId)
      .select()

    if (error) {
      console.error("Error updating account status:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/organization/user-accounts")
    return { success: true, data }
  } catch (error) {
    console.error("Error in toggleAccountStatus:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function deleteUserAccount(accountId: string) {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("user_accounts").delete().eq("id", accountId)

    if (error) {
      console.error("Error deleting account:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/organization/user-accounts")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteUserAccount:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
