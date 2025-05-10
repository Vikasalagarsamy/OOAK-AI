"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteUserAccountEnhanced(accountId: string) {
  const supabase = createClient()
  console.log(`Attempting to delete user account with ID: ${accountId}`)

  try {
    // First, check if the account exists
    const { data: account, error: checkError } = await supabase
      .from("user_accounts")
      .select("id, employee_id, role_id")
      .eq("id", accountId)
      .single()

    if (checkError) {
      console.error("Error checking if account exists:", checkError)
      return {
        success: false,
        error: `Account check failed: ${checkError.message}`,
        details: checkError,
      }
    }

    if (!account) {
      console.error("Account not found:", accountId)
      return {
        success: false,
        error: "Account not found",
      }
    }

    console.log("Account found:", account)

    // Check for any foreign key constraints that might prevent deletion
    // This is just for debugging purposes
    const { data: constraints, error: constraintsError } = await supabase
      .rpc("check_foreign_key_constraints", {
        table_name: "user_accounts",
        record_id: accountId,
      })
      .select()

    if (constraintsError) {
      console.log("Error checking constraints (this is expected if the function doesn't exist):", constraintsError)
      // Continue anyway, this is just for debugging
    } else if (constraints && constraints.length > 0) {
      console.log("Found constraints that might prevent deletion:", constraints)
    }

    // Now try to delete the account
    const { error: deleteError } = await supabase.from("user_accounts").delete().eq("id", accountId)

    if (deleteError) {
      console.error("Error deleting account:", deleteError)

      // Check if it's a foreign key constraint error
      if (
        deleteError.message.includes("foreign key constraint") ||
        deleteError.message.includes("violates foreign key constraint")
      ) {
        return {
          success: false,
          error: "Cannot delete this account because it is referenced by other records in the system.",
          details: deleteError,
        }
      }

      return {
        success: false,
        error: `Delete failed: ${deleteError.message}`,
        details: deleteError,
      }
    }

    console.log("Account deleted successfully")
    revalidatePath("/organization/user-accounts")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in deleteUserAccountEnhanced:", error)
    return {
      success: false,
      error: "An unexpected error occurred while deleting the user account",
      details: error,
    }
  }
}

// Create a function to check if the RPC function exists and create it if it doesn't
export async function ensureConstraintCheckFunction() {
  const supabase = createClient()

  try {
    // Check if the function exists
    const { data, error } = await supabase.rpc("check_function_exists", {
      function_name: "check_foreign_key_constraints",
    })

    if (error) {
      console.error("Error checking if function exists:", error)
      return { success: false, error: error.message }
    }

    if (!data || !data.exists) {
      // Create the function
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION check_foreign_key_constraints(
          table_name text,
          record_id text
        ) RETURNS json AS $$
        DECLARE
          result json;
        BEGIN
          -- This is a simplified version that just returns the table name and record ID
          -- In a real implementation, you would query information_schema to find actual constraints
          result := json_build_object(
            'table', table_name,
            'record_id', record_id,
            'message', 'This is a placeholder. Actual constraint checking not implemented.'
          );
          
          RETURN result;
        END;
        $$ LANGUAGE plpgsql;
      `

      const { error: createError } = await supabase.rpc("exec_sql", {
        sql: createFunctionSQL,
      })

      if (createError) {
        console.error("Error creating constraint check function:", createError)
        return { success: false, error: createError.message }
      }

      return { success: true, message: "Constraint check function created" }
    }

    return { success: true, message: "Constraint check function already exists" }
  } catch (error) {
    console.error("Unexpected error in ensureConstraintCheckFunction:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
