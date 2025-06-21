"use server"

import { query, transaction } from "@/lib/postgresql-client"
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
    console.log('👤 Creating user account for:', username)

    // Check if username already exists
    const existingUserResult = await query(
      "SELECT id FROM user_accounts WHERE username = $1 LIMIT 1",
      [username]
    )

    if (existingUserResult.rows.length > 0) {
      throw new Error("Username already exists")
    }

    // Hash the password
    console.log('🔐 Hashing password...')
    const passwordHash = await bcrypt.hash(password, 10)

    // Create the user account
    console.log('💾 Inserting user account...')
    const insertResult = await query(
      `INSERT INTO user_accounts 
       (username, email, password_hash, employee_id, role_id, is_active, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id`,
      [
        username,
        email,
        passwordHash,
        employeeId,
        roleId,
        true,
        new Date().toISOString()
      ]
    )

    console.log(`✅ User account created successfully with ID: ${insertResult.rows[0].id}`)
    return { success: true }
  } catch (error: any) {
    console.error("❌ Error in createUserAccount:", error)
    return { success: false, error: error.message }
  }
}

export async function updateUserRole({ userId, roleId }: UpdateUserRoleParams) {
  try {
    console.log(`🔄 Updating user role for user ID ${userId} to role ID ${roleId}`)

    const updateResult = await query(
      "UPDATE user_accounts SET role_id = $1 WHERE id = $2",
      [roleId, userId]
    )

    if (updateResult.rowCount === 0) {
      throw new Error("User not found")
    }

    console.log('✅ User role updated successfully')
    return { success: true }
  } catch (error: any) {
    console.error("❌ Error in updateUserRole:", error)
    return { success: false, error: error.message }
  }
}

export async function getUsersWithRole(roleId: number) {
  try {
    console.log(`📋 Fetching users with role ID: ${roleId}`)

    const usersResult = await query(
      `SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.employee_id, 
        u.last_login, 
        u.is_active,
        e.first_name, 
        e.last_name
       FROM user_accounts u
       LEFT JOIN employees e ON u.employee_id = e.id
       WHERE u.role_id = $1
       ORDER BY u.username`,
      [roleId]
    )

    // Format the data to match the expected structure
    const formattedData = usersResult.rows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      employee_id: row.employee_id,
      last_login: row.last_login,
      is_active: row.is_active,
      employees: {
        first_name: row.first_name,
        last_name: row.last_name
      }
    }))

    console.log(`✅ Found ${formattedData.length} users with role ID ${roleId}`)
    return { success: true, data: formattedData }
  } catch (error: any) {
    console.error("❌ Error in getUsersWithRole:", error)
    return { success: false, error: error.message, data: [] }
  }
}
