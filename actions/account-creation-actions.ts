"use server"

import { createClient } from "@/lib/supabase-server"
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
        email,
        department_id,
        departments(name),
        designation_id,
        designations(name)
      `)
      .eq("status", "active")
      .order("first_name", { ascending: true })

    if (error) throw error

    // Transform the data to include department_name and designation_name
    return data.map((employee) => ({
      ...employee,
      department_name: employee.departments?.name,
      designation_name: employee.designations?.name,
    }))
  } catch (error) {
    console.error("Error fetching employees:", error)
    return []
  }
}

// Update the getRoles function to remove the ordering by name since that column doesn't exist
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

export async function checkExistingAccount(employeeId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("user_accounts").select("id").eq("employee_id", employeeId).single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return !!data
  } catch (error) {
    console.error("Error checking existing account:", error)
    return false
  }
}

export async function createUserAccount(formData: {
  employeeId: string
  roleId: string
  password: string
}) {
  const supabase = createClient()

  try {
    // Check if account already exists
    const accountExists = await checkExistingAccount(formData.employeeId)
    if (accountExists) {
      return {
        success: false,
        error: "An account already exists for this employee",
      }
    }

    // Get employee details
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("email")
      .eq("id", formData.employeeId)
      .single()

    if (employeeError) throw employeeError

    if (!employee?.email) {
      return {
        success: false,
        error: "Employee does not have an email address",
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(formData.password, 10)

    // Create user account
    const { error } = await supabase.from("user_accounts").insert({
      employee_id: formData.employeeId,
      role_id: formData.roleId,
      email: employee.email,
      password_hash: hashedPassword,
      is_active: true,
      created_at: new Date().toISOString(),
    })

    if (error) throw error

    // Revalidate the path to update UI
    revalidatePath("/organization/account-creation")

    return {
      success: true,
    }
  } catch (error: any) {
    console.error("Error creating user account:", error)
    return {
      success: false,
      error: error.message || "Failed to create user account",
    }
  }
}
