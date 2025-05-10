"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function ensureUserAccountsTable() {
  const supabase = createClient()

  try {
    console.log("Ensuring user_accounts table exists...")

    // Check if the table_exists function exists
    const { data: functionExists, error: functionError } = await supabase
      .from("pg_proc")
      .select("proname")
      .eq("proname", "table_exists")
      .limit(1)

    if (functionError) {
      console.error("Error checking if table_exists function exists:", functionError)

      // Create the table_exists function
      const { error: createFunctionError } = await supabase.rpc("execute_sql", {
        sql_statement: `
          CREATE OR REPLACE FUNCTION table_exists(table_name TEXT) RETURNS BOOLEAN AS $$
          BEGIN
              RETURN EXISTS (
                  SELECT FROM information_schema.tables 
                  WHERE table_schema = 'public'
                  AND table_name = $1
              );
          END;
          $$ LANGUAGE plpgsql;
        `,
      })

      if (createFunctionError) {
        console.error("Error creating table_exists function:", createFunctionError)
        return {
          success: false,
          error: `Failed to create table_exists function: ${createFunctionError.message}`,
        }
      }
    }

    // Check if the user_accounts table exists
    const { data: tableExists, error: tableError } = await supabase.rpc("table_exists", {
      table_name: "user_accounts",
    })

    if (tableError) {
      console.error("Error checking if user_accounts table exists:", tableError)
      return {
        success: false,
        error: `Failed to check if user_accounts table exists: ${tableError.message}`,
      }
    }

    if (!tableExists) {
      console.log("Creating user_accounts table...")

      // Create the user_accounts table
      const { error: createTableError } = await supabase.rpc("execute_sql", {
        sql_statement: `
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
          
          -- Add an index on employee_id for faster lookups
          CREATE INDEX idx_user_accounts_employee_id ON user_accounts(employee_id);
          
          -- Add an index on role_id for faster lookups
          CREATE INDEX idx_user_accounts_role_id ON user_accounts(role_id);
        `,
      })

      if (createTableError) {
        console.error("Error creating user_accounts table:", createTableError)
        return {
          success: false,
          error: `Failed to create user_accounts table: ${createTableError.message}`,
        }
      }

      console.log("user_accounts table created successfully")
    } else {
      console.log("user_accounts table already exists")
    }

    revalidatePath("/organization/account-creation")
    return { success: true, message: "User accounts table checked and created if needed" }
  } catch (error: any) {
    console.error("Error in ensureUserAccountsTable:", error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message}`,
    }
  }
}
