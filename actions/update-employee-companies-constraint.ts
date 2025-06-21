"use server"

import { query, transaction } from "@/lib/postgresql-client"

/**
 * UPDATE EMPLOYEE COMPANIES CONSTRAINT - NOW 100% POSTGRESQL
 * 
 * Complete migration from Supabase to PostgreSQL
 * - Direct DDL operations for constraint management
 * - Enhanced error handling and logging
 * - Database schema optimization
 * - All Supabase dependencies eliminated
 */

export async function updateEmployeeCompaniesConstraint() {
  try {
    console.log('🔧 Starting employee companies constraint update via PostgreSQL...')

    // Step 1: Check if the old constraint exists
    console.log('🔍 Checking for existing constraint...')
    const constraintCheckResult = await query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE constraint_name = $1
      AND table_name = $2
      AND table_schema = 'public'
    `, ['employee_companies_employee_id_company_id_key', 'employee_companies'])

    const constraintExists = constraintCheckResult.rows.length > 0

    // Step 2: Drop the old constraint if it exists
    if (constraintExists) {
      console.log('🗑️ Dropping old constraint...')
      await query(`
        ALTER TABLE employee_companies 
        DROP CONSTRAINT IF EXISTS employee_companies_employee_id_company_id_key
      `)
      console.log('✅ Old constraint dropped successfully')
    } else {
      console.log('ℹ️ Old constraint does not exist, skipping drop operation')
    }

    // Step 3: Add the new constraint
    console.log('➕ Adding new unique constraint...')
    await query(`
      ALTER TABLE employee_companies 
      ADD CONSTRAINT employee_companies_employee_id_company_id_branch_id_key 
      UNIQUE (employee_id, company_id, branch_id)
    `)
    console.log('✅ New constraint added successfully')

    // Step 4: Verify the constraint was created
    console.log('🔍 Verifying new constraint...')
    const verificationResult = await query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE constraint_name = $1
      AND table_name = $2
      AND table_schema = 'public'
    `, ['employee_companies_employee_id_company_id_branch_id_key', 'employee_companies'])

    if (verificationResult.rows.length === 0) {
      throw new Error('New constraint was not created successfully')
    }

    console.log('🎉 Database constraints updated successfully!')
    return {
      success: true,
      message:
        "Database constraints updated successfully. The system now allows the same company to be assigned to different branches.",
    }
  } catch (error) {
    console.error("❌ Error in updateEmployeeCompaniesConstraint:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
} 