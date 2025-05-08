"use server"

import { createClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"

interface CreateUserAccountParams {
  username: string
  email: string
  password: string
  employeeId: number
  roleId: number
}

interface UpdateUserRoleParams {
  userId: number
  roleId: number
}

export async function createUserAccount({ username, email, password, employeeId, roleId }: CreateUserAccountParams) {
  try {
    const supabase = createClient()

    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("user_accounts")
      .select("id")
      .eq("username", username)
      .maybeSingle()

    if (checkError) {
      throw new Error(`Error checking username: ${checkError.message}`)
    }

    if (existingUser) {
      throw new Error("Username already exists")
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create the user account
    const { data, error } = await supabase.from("user_accounts").insert({
      username,
      email,
      password_hash: passwordHash,
      employee_id: employeeId,
      role_id: roleId,
      is_active: true,
      created_at: new Date().toISOString(),
    })

    if (error) {
      throw new Error(`Error creating user account: ${error.message}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in createUserAccount:", error)
    return { success: false, error: error.message }
  }
}

export async function updateUserRole({ userId, roleId }: UpdateUserRoleParams) {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("user_accounts").update({ role_id: roleId }).eq("id", userId)

    if (error) {
      throw new Error(`Error updating user role: ${error.message}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in updateUserRole:", error)
    return { success: false, error: error.message }
  }
}

export async function getUsersWithRole(roleId: number) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("user_accounts")
      .select(`
        id, 
        username, 
        email, 
        employee_id, 
        last_login, 
        is_active,
        employees:employee_id (
          first_name, 
          last_name
        )
      `)
      .eq("role_id", roleId)
      .order("username")

    if (error) {
      throw new Error(`Error fetching users: ${error.message}`)
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error in getUsersWithRole:", error)
    return { success: false, error: error.message, data: [] }
  }
}
