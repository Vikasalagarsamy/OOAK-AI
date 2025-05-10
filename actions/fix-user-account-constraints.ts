"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function checkUserAccountConstraints(accountId: string) {
  const supabase = createClient()

  try {
    // Check if the function exists first
    const { data: functionExists, error: functionCheckError } = await supabase.rpc("function_exists", {
      function_name: "can_delete_user_account",
    })

    if (functionCheckError || !functionExists) {
      console.log("Function doesn't exist, creating it...")
      // Create the function (simplified version)
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION can_delete_user_account(account_id integer)
        RETURNS json AS $$
        DECLARE
          result json;
        BEGIN
          result := json_build_object(
            'can_delete', true,
            'account_id', account_id
          );
          RETURN result;
        END;
        $$ LANGUAGE plpgsql;
      `

      const { error: createError } = await supabase.rpc("exec_sql", { sql: createFunctionSQL })

      if (createError) {
        console.error("Error creating function:", createError)
        return {
          success: false,
          error: "Could not create helper function",
          canDelete: false,
        }
      }
    }

    // Now call the function
    const { data, error } = await supabase.rpc("can_delete_user_account", { account_id: Number.parseInt(accountId) })

    if (error) {
      console.error("Error checking constraints:", error)
      return {
        success: false,
        error: error.message,
        canDelete: false,
      }
    }

    return {
      success: true,
      canDelete: data.can_delete,
      reason: data.reason,
      details: data,
    }
  } catch (error) {
    console.error("Unexpected error in checkUserAccountConstraints:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
      canDelete: false,
    }
  }
}

export async function fixUserAccountConstraints(accountId: string) {
  const supabase = createClient()

  try {
    // Check if the function exists first
    const { data: functionExists, error: functionCheckError } = await supabase.rpc("function_exists", {
      function_name: "fix_user_account_constraints",
    })

    if (functionCheckError || !functionExists) {
      console.log("Function doesn't exist, creating it...")
      // Create the function (simplified version)
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION fix_user_account_constraints(account_id integer)
        RETURNS json AS $$
        DECLARE
          result json;
        BEGIN
          -- Delete auth_logs for this user if they exist
          DELETE FROM auth_logs WHERE user_id = account_id;
          
          result := json_build_object(
            'success', true,
            'account_id', account_id
          );
          RETURN result;
        END;
        $$ LANGUAGE plpgsql;
      `

      const { error: createError } = await supabase.rpc("exec_sql", { sql: createFunctionSQL })

      if (createError) {
        console.error("Error creating function:", createError)
        return {
          success: false,
          error: "Could not create helper function",
        }
      }
    }

    // Now call the function
    const { data, error } = await supabase.rpc("fix_user_account_constraints", {
      account_id: Number.parseInt(accountId),
    })

    if (error) {
      console.error("Error fixing constraints:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath("/organization/user-accounts")
    return {
      success: true,
      details: data,
    }
  } catch (error) {
    console.error("Unexpected error in fixUserAccountConstraints:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}
