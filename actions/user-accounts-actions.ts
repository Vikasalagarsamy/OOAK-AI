"use server"

import { pool } from '@/lib/postgresql-client'
import { revalidatePath } from "next/cache"

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

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
  try {
    console.log("🐘 Fetching user accounts from PostgreSQL...")

    const client = await pool.connect()
    
    // Get user accounts with employee and role information using JOIN
    const query = `
      SELECT 
        ua.id,
        ua.username,
        ua.email,
        ua.is_active,
        ua.last_login,
        ua.created_at,
        ua.updated_at,
        ua.employee_id,
        ua.role_id,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        r.title as role_title
      FROM user_accounts ua
      LEFT JOIN employees e ON ua.employee_id = e.id
      LEFT JOIN roles r ON ua.role_id = r.id
      ORDER BY ua.created_at DESC
    `
    
    const result = await client.query(query)
    client.release()

    console.log(`✅ Retrieved ${result.rows.length} user accounts from PostgreSQL`)

    return { data: result.rows, error: null }

  } catch (error) {
    console.error("❌ Error fetching user accounts from PostgreSQL:", error)
    return {
      data: [],
      error: "Failed to retrieve user accounts from database",
    }
  }
}

export async function toggleAccountStatus(accountId: string, isActive: boolean) {
  try {
    console.log(`🐘 Toggling account status for ID ${accountId} to ${isActive}`)

    const client = await pool.connect()
    
    const query = `
      UPDATE user_accounts 
      SET is_active = $1, updated_at = $2 
      WHERE id = $3
      RETURNING *
    `
    
    const values = [isActive, new Date().toISOString(), accountId]
    const result = await client.query(query, values)
    client.release()

    if (result.rows.length === 0) {
      return { success: false, error: "Account not found" }
    }

    console.log("✅ Account status updated successfully")
    revalidatePath("/organization/user-accounts")
    return { success: true, data: result.rows[0] }

  } catch (error) {
    console.error("❌ Error updating account status:", error)
    return { success: false, error: "Failed to update account status" }
  }
}

export async function deleteUserAccount(accountId: string) {
  try {
    console.log(`🐘 Deleting user account ID ${accountId}`)

    const client = await pool.connect()
    
    const query = `DELETE FROM user_accounts WHERE id = $1`
    const result = await client.query(query, [accountId])
    client.release()

    if (result.rowCount === 0) {
      return { success: false, error: "Account not found" }
    }

    console.log("✅ Account deleted successfully")
    revalidatePath("/organization/user-accounts")
    return { success: true }

  } catch (error) {
    console.error("❌ Error deleting account:", error)
    return { success: false, error: "Failed to delete account" }
  }
}
