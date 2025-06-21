"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"

export async function deleteUserAccountEnhanced(accountId: string) {
  console.log(`🗑️ [USER ACCOUNTS] Attempting to delete user account with ID: ${accountId} via PostgreSQL`)

  try {
    return await transaction(async (client) => {
      // First, check if the account exists
      const accountResult = await client.query(`
        SELECT id, employee_id, role_id 
        FROM user_accounts 
        WHERE id = $1
      `, [accountId])

      if (accountResult.rows.length === 0) {
        console.error("❌ [USER ACCOUNTS] Account not found:", accountId)
        return {
          success: false,
          error: "Account not found",
        }
      }

      const account = accountResult.rows[0]
      console.log("✅ [USER ACCOUNTS] Account found:", account)

      // Check for any foreign key constraints that might prevent deletion
      // Query to find referencing tables (simplified approach)
      const constraintCheckResult = await client.query(`
        SELECT 
          tc.table_name,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND kcu.referenced_table_name = 'user_accounts'
          AND kcu.referenced_column_name = 'id'
      `)

      if (constraintCheckResult.rows.length > 0) {
        console.log("⚠️ [USER ACCOUNTS] Found potential foreign key references:", constraintCheckResult.rows)
        
        // Check if there are actual references
        for (const constraint of constraintCheckResult.rows) {
          const refCheckResult = await client.query(`
            SELECT COUNT(*) as count 
            FROM ${constraint.table_name} 
            WHERE ${constraint.column_name} = $1
          `, [accountId])
          
          if (parseInt(refCheckResult.rows[0]?.count) > 0) {
            return {
              success: false,
              error: "Cannot delete this account because it is referenced by other records in the system.",
              details: `Referenced by ${constraint.table_name}.${constraint.column_name}`,
            }
          }
        }
      }

      // Now try to delete the account
      const deleteResult = await client.query(`
        DELETE FROM user_accounts WHERE id = $1 RETURNING id
      `, [accountId])

      if (deleteResult.rows.length === 0) {
        return {
          success: false,
          error: "Failed to delete account - account may have been deleted by another process",
        }
      }

      console.log("✅ [USER ACCOUNTS] Account deleted successfully")
      revalidatePath("/organization/user-accounts")
      return { success: true }
    })
  } catch (error: any) {
    console.error("❌ [USER ACCOUNTS] Unexpected error in deleteUserAccountEnhanced:", error)
    
    // Check if it's a foreign key constraint error
    if (
      error.message.includes("foreign key constraint") ||
      error.message.includes("violates foreign key constraint") ||
      error.code === '23503' // PostgreSQL foreign key violation code
    ) {
      return {
        success: false,
        error: "Cannot delete this account because it is referenced by other records in the system.",
        details: error.message,
      }
    }

    return {
      success: false,
      error: "An unexpected error occurred while deleting the user account",
      details: error.message,
    }
  }
}

// Create a function to check constraint function (PostgreSQL version)
export async function ensureConstraintCheckFunction() {
  try {
    console.log("🔧 [USER ACCOUNTS] Ensuring constraint check functions exist via PostgreSQL...")

    // Create a PostgreSQL function to check foreign key constraints
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION check_foreign_key_constraints(
        table_name text,
        record_id text
      ) RETURNS jsonb AS $$
      DECLARE
        result jsonb;
        constraint_record record;
        ref_count integer;
        constraints jsonb := '[]'::jsonb;
      BEGIN
        -- Find all foreign key constraints that reference the given table
        FOR constraint_record IN 
          SELECT 
            tc.table_name as referencing_table,
            kcu.column_name as referencing_column,
            ccu.table_name as referenced_table,
            ccu.column_name as referenced_column
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = table_name
        LOOP
          -- Check if there are actual references
          EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I = $1', 
                        constraint_record.referencing_table, 
                        constraint_record.referencing_column) 
          INTO ref_count 
          USING record_id;
          
          IF ref_count > 0 THEN
            constraints := constraints || jsonb_build_object(
              'table', constraint_record.referencing_table,
              'column', constraint_record.referencing_column,
              'count', ref_count
            );
          END IF;
        END LOOP;
        
        result := jsonb_build_object(
          'table', table_name,
          'record_id', record_id,
          'constraints', constraints,
          'has_references', jsonb_array_length(constraints) > 0
        );
        
        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `

    await query(createFunctionSQL)

    console.log("✅ [USER ACCOUNTS] Constraint check function created/updated successfully")
    return { success: true, message: "Constraint check function created/updated successfully" }
  } catch (error: any) {
    console.error("❌ [USER ACCOUNTS] Error creating constraint check function:", error)
    return { success: false, error: error.message }
  }
}

// Additional helper function to get account details
export async function getUserAccountDetails(accountId: string) {
  try {
    console.log(`👤 [USER ACCOUNTS] Fetching account details for ${accountId} via PostgreSQL...`)

    const result = await query(`
      SELECT 
        ua.*,
        e.first_name,
        e.last_name,
        e.email as employee_email,
        r.name as role_name
      FROM user_accounts ua
      LEFT JOIN employees e ON ua.employee_id = e.id
      LEFT JOIN roles r ON ua.role_id = r.id
      WHERE ua.id = $1
    `, [accountId])

    if (result.rows.length === 0) {
      return { success: false, error: "Account not found" }
    }

    console.log(`✅ [USER ACCOUNTS] Account details fetched successfully`)
    return { success: true, data: result.rows[0] }
  } catch (error: any) {
    console.error("❌ [USER ACCOUNTS] Error fetching account details:", error)
    return { success: false, error: error.message }
  }
}
