"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"

export async function ensureUserAccountsTable() {
  try {
    console.log("🔧 [USER ACCOUNTS] Ensuring user_accounts table exists via PostgreSQL...")

    // Check if the user_accounts table exists using PostgreSQL
    const tableExistsResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'user_accounts' AND table_schema = 'public'
    `)

    if (tableExistsResult.rows.length > 0) {
      console.log("✅ [USER ACCOUNTS] user_accounts table already exists")
      return { success: true, message: "User accounts table already exists" }
    }

    console.log("📝 [USER ACCOUNTS] Creating user_accounts table...")

    // Create the user_accounts table using PostgreSQL
    const createTableSQL = `
          CREATE TABLE user_accounts (
            id SERIAL PRIMARY KEY,
            employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
            username VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
      -- Add indexes for faster lookups
          CREATE INDEX idx_user_accounts_employee_id ON user_accounts(employee_id);
          CREATE INDEX idx_user_accounts_role_id ON user_accounts(role_id);
      CREATE INDEX idx_user_accounts_username ON user_accounts(username);
      CREATE INDEX idx_user_accounts_email ON user_accounts(email);
    `

    await query(createTableSQL)

    console.log("✅ [USER ACCOUNTS] user_accounts table created successfully")
    revalidatePath("/organization/account-creation")
    return { success: true, message: "User accounts table created successfully" }
  } catch (error: any) {
    console.error("❌ [USER ACCOUNTS] Error in ensureUserAccountsTable:", error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message}`,
    }
  }
}
