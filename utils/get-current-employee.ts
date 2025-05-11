import { createClient } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth-utils"

export async function getCurrentEmployeeId() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.id) {
      return null
    }

    // If the user already has an employeeId, return it
    if (currentUser.employeeId) {
      return currentUser.employeeId
    }

    // Otherwise, try to find the employee record linked to this user
    const supabase = createClient()
    const { data, error } = await supabase.from("employees").select("id").eq("user_id", currentUser.id).single()

    if (error || !data) {
      console.error("Error finding employee record for user:", currentUser.id, error)
      return null
    }

    return data.id
  } catch (error) {
    console.error("Error getting current employee ID:", error)
    return null
  }
}

export async function getCurrentEmployee() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.id) {
      return null
    }

    const supabase = createClient()

    // Try to find the employee by employeeId if available
    if (currentUser.employeeId) {
      const { data, error } = await supabase.from("employees").select("*").eq("id", currentUser.employeeId).single()

      if (!error && data) {
        return data
      }
    }

    // Otherwise, try to find by user_id
    const { data, error } = await supabase.from("employees").select("*").eq("user_id", currentUser.id).single()

    if (error || !data) {
      console.error("Error finding employee record for user:", currentUser.id, error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error getting current employee:", error)
    return null
  }
}
