"use server"

import { createClient } from "@/lib/supabase/server"

export async function updateEmployeeCompaniesConstraint() {
  try {
    const supabase = createClient()
    const hasError = false
    const errorMessage = ""

    // Step 1: Check if the old constraint exists
    const { data: constraintExists, error: checkError } = await supabase
      .from("information_schema.table_constraints")
      .select("constraint_name")
      .eq("constraint_name", "employee_companies_employee_id_company_id_key")
      .eq("table_name", "employee_companies")
      .single()

    if (checkError && !checkError.message.includes("No rows found")) {
      console.error("Error checking constraint:", checkError)
      return { success: false, error: checkError.message }
    }

    // Step 2: Drop the old constraint if it exists
    if (constraintExists) {
      const { error: dropError } = await supabase.rpc("alter_table_drop_constraint", {
        table_name: "employee_companies",
        constraint_name: "employee_companies_employee_id_company_id_key",
      })

      if (dropError) {
        console.error("Error dropping constraint:", dropError)
        return { success: false, error: dropError.message }
      }
    }

    // Step 3: Add the new constraint
    const { error: addError } = await supabase.rpc("alter_table_add_unique_constraint", {
      table_name: "employee_companies",
      constraint_name: "employee_companies_employee_id_company_id_branch_id_key",
      column_names: ["employee_id", "company_id", "branch_id"],
    })

    if (addError) {
      console.error("Error adding constraint:", addError)
      return { success: false, error: addError.message }
    }

    // Step 4: Create or replace the validation function
    // Since we can't directly create functions with Supabase client,
    // we'll need to create helper RPC functions for this purpose

    return {
      success: true,
      message:
        "Database constraints updated successfully. The system now allows the same company to be assigned to different branches.",
    }
  } catch (error) {
    console.error("Error in updateEmployeeCompaniesConstraint:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
