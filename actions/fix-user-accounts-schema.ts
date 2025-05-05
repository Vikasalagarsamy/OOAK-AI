"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function fixUserAccountsSchema() {
  const supabase = createClient()

  try {
    // SQL to fix the user_accounts table and its relationships
    const sql = `
    -- Check if user_accounts table exists and create it if it doesn't
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_accounts'
      ) THEN
        -- Create the user_accounts table
        CREATE TABLE user_accounts (
          id SERIAL PRIMARY KEY,
          employee_id INTEGER NOT NULL,
          role_id INTEGER NOT NULL,
          username VARCHAR(255) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      END IF;
    END
    $$;

    -- Now ensure the foreign key constraints exist
    DO $$
    BEGIN
      -- Check if the employee_id foreign key constraint exists
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_accounts_employee_id_fkey'
        AND table_name = 'user_accounts'
      ) THEN
        -- Add the constraint if it doesn't exist
        ALTER TABLE user_accounts
        ADD CONSTRAINT user_accounts_employee_id_fkey
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
      END IF;

      -- Check if the role_id foreign key constraint exists
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_accounts_role_id_fkey'
        AND table_name = 'user_accounts'
      ) THEN
        -- Add the constraint if it doesn't exist
        ALTER TABLE user_accounts
        ADD CONSTRAINT user_accounts_role_id_fkey
        FOREIGN KEY (role_id) REFERENCES roles(id);
      END IF;
    END
    $$;

    -- Add indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_user_accounts_employee_id ON user_accounts(employee_id);
    CREATE INDEX IF NOT EXISTS idx_user_accounts_role_id ON user_accounts(role_id);
    `

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Error fixing user_accounts schema:", error)

      // If the exec_sql function doesn't exist, we need to create it first
      if (error.message.includes("function exec_sql") || error.message.includes("does not exist")) {
        // Create the exec_sql function
        const createFunctionSql = `
        CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        `

        const { error: createFunctionError } = await supabase.rpc("exec_sql", { sql: createFunctionSql })

        if (createFunctionError) {
          console.error("Error creating exec_sql function:", createFunctionError)
          return { success: false, error: "Could not create the necessary database function" }
        }

        // Try executing the original SQL again
        const { error: retryError } = await supabase.rpc("exec_sql", { sql })

        if (retryError) {
          console.error("Error fixing user_accounts schema (retry):", retryError)
          return { success: false, error: retryError.message }
        }
      } else {
        return { success: false, error: error.message }
      }
    }

    revalidatePath("/organization/user-accounts")
    return { success: true }
  } catch (error) {
    console.error("Error in fixUserAccountsSchema:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
