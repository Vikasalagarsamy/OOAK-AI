"use server"

import { query } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"

export async function checkUserAccountConstraints(accountId: string) {
  try {
    console.log(`🔍 [USER_CONSTRAINTS] Checking constraints for account ${accountId} via PostgreSQL...`)

    const accountIdNum = parseInt(accountId)
    if (isNaN(accountIdNum)) {
      return {
        success: false,
        error: "Invalid account ID",
        canDelete: false,
      }
    }

    // Check if the account exists
    const accountCheckResult = await query(`
      SELECT id, username, email, is_active 
      FROM user_accounts 
      WHERE id = $1
    `, [accountIdNum])

    if (accountCheckResult.rows.length === 0) {
      return {
        success: false,
        error: "Account not found",
        canDelete: false,
      }
    }

    const account = accountCheckResult.rows[0]

    // Check for dependencies that would prevent deletion
    const dependenciesResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM auth_logs WHERE user_id = $1) as auth_logs_count,
        (SELECT COUNT(*) FROM leads WHERE assigned_to = (SELECT employee_id FROM user_accounts WHERE id = $1)) as assigned_leads_count,
        (SELECT COUNT(*) FROM tasks WHERE assigned_to = (SELECT employee_id FROM user_accounts WHERE id = $1)) as assigned_tasks_count
    `, [accountIdNum])

    const dependencies = dependenciesResult.rows[0]
    const totalDependencies = parseInt(dependencies.auth_logs_count || 0) + 
                             parseInt(dependencies.assigned_leads_count || 0) + 
                             parseInt(dependencies.assigned_tasks_count || 0)

    console.log(`📊 [USER_CONSTRAINTS] Found ${totalDependencies} total dependencies for account ${accountId}`)

    const canDelete = totalDependencies === 0
    let reason = canDelete ? "No dependencies found" : "Has dependent records"

    const details = {
      account_id: accountIdNum,
      username: account.username,
      email: account.email,
      is_active: account.is_active,
      dependencies: {
        auth_logs: parseInt(dependencies.auth_logs_count || 0),
        assigned_leads: parseInt(dependencies.assigned_leads_count || 0),
        assigned_tasks: parseInt(dependencies.assigned_tasks_count || 0)
      },
      can_delete: canDelete,
      reason: reason
    }

    console.log(`✅ [USER_CONSTRAINTS] Constraint check completed for account ${accountId}`)

    return {
      success: true,
      canDelete,
      reason,
      details,
    }
  } catch (error: any) {
    console.error("❌ [USER_CONSTRAINTS] Unexpected error in checkUserAccountConstraints:", error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message}`,
      canDelete: false,
    }
  }
}

export async function fixUserAccountConstraints(accountId: string) {
  try {
    console.log(`🔧 [USER_CONSTRAINTS] Fixing constraints for account ${accountId} via PostgreSQL...`)

    const accountIdNum = parseInt(accountId)
    if (isNaN(accountIdNum)) {
      return {
        success: false,
        error: "Invalid account ID",
      }
    }

    // Check if the account exists first
    const accountCheckResult = await query(`
      SELECT id, username 
      FROM user_accounts 
      WHERE id = $1
    `, [accountIdNum])

    if (accountCheckResult.rows.length === 0) {
      return {
        success: false,
        error: "Account not found",
      }
    }

    const account = accountCheckResult.rows[0]

    console.log(`🗑️ [USER_CONSTRAINTS] Cleaning up dependencies for account ${account.username}...`)

    // Delete auth_logs for this user
    const authLogsResult = await query(`
      DELETE FROM auth_logs 
      WHERE user_id = $1
      RETURNING id
    `, [accountIdNum])

    const deletedAuthLogs = authLogsResult.rowCount || 0

    // Unassign leads from this user's employee
    const unassignLeadsResult = await query(`
      UPDATE leads 
      SET assigned_to = NULL, updated_at = NOW()
      WHERE assigned_to = (
        SELECT employee_id 
        FROM user_accounts 
        WHERE id = $1
      )
      RETURNING id
    `, [accountIdNum])

    const unassignedLeads = unassignLeadsResult.rowCount || 0

    // Unassign tasks from this user's employee
    const unassignTasksResult = await query(`
      UPDATE tasks 
      SET assigned_to = NULL, updated_at = NOW()
      WHERE assigned_to = (
        SELECT employee_id 
        FROM user_accounts 
        WHERE id = $1
      )
      RETURNING id
    `, [accountIdNum])

    const unassignedTasks = unassignTasksResult.rowCount || 0

    console.log(`✅ [USER_CONSTRAINTS] Cleaned up ${deletedAuthLogs} auth logs, ${unassignedLeads} leads, ${unassignedTasks} tasks`)

    revalidatePath("/organization/user-accounts")

    return {
      success: true,
      details: {
        account_id: accountIdNum,
        username: account.username,
        cleaned_up: {
          auth_logs_deleted: deletedAuthLogs,
          leads_unassigned: unassignedLeads,
          tasks_unassigned: unassignedTasks
        }
      },
    }
  } catch (error: any) {
    console.error("❌ [USER_CONSTRAINTS] Unexpected error in fixUserAccountConstraints:", error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message}`,
    }
  }
}
