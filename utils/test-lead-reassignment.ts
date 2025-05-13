import { createClient } from "@/lib/supabase/server"

/**
 * Utility function to test the lead reassignment functionality
 * This simulates an employee status change and verifies the results
 */
export async function testLeadReassignment(employeeId: number, newStatus: string) {
  const supabase = createClient()
  const results = {
    success: false,
    employeeDetails: null,
    affectedLeads: [],
    notifications: [],
    activities: [],
    errors: [],
  }

  try {
    // 1. Get employee details before change
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("id, first_name, last_name, status")
      .eq("id", employeeId)
      .single()

    if (employeeError) {
      results.errors.push(`Error fetching employee: ${employeeError.message}`)
      return results
    }

    results.employeeDetails = employeeData
    const oldStatus = employeeData.status

    // 2. Get count of leads assigned to this employee before change
    const { data: leadsBeforeData, error: leadsBeforeError } = await supabase
      .from("leads")
      .select("id, lead_number, status")
      .eq("assigned_to", employeeId)
      .not("status", "in", ["WON", "REJECTED"])

    if (leadsBeforeError) {
      results.errors.push(`Error fetching leads: ${leadsBeforeError.message}`)
      return results
    }

    const leadCountBefore = leadsBeforeData?.length || 0

    // 3. Update employee status to trigger the function
    const { error: updateError } = await supabase.from("employees").update({ status: newStatus }).eq("id", employeeId)

    if (updateError) {
      results.errors.push(`Error updating employee status: ${updateError.message}`)
      return results
    }

    // 4. Wait a moment for the trigger to execute
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 5. Check if leads were reassigned
    const { data: leadsAfterData, error: leadsAfterError } = await supabase
      .from("leads")
      .select("id, lead_number, status, previous_assigned_to, reassignment_reason")
      .eq("previous_assigned_to", employeeId)
      .eq("reassignment_reason", `EMPLOYEE_STATUS_${newStatus.toUpperCase()}`)

    if (leadsAfterError) {
      results.errors.push(`Error fetching reassigned leads: ${leadsAfterError.message}`)
    } else {
      results.affectedLeads = leadsAfterData || []
    }

    // 6. Check for notifications
    const { data: notificationsData, error: notificationsError } = await supabase
      .from("notifications")
      .select("*")
      .ilike("message", `%${employeeData.first_name} ${employeeData.last_name}%`)
      .order("created_at", { ascending: false })
      .limit(5)

    if (notificationsError) {
      results.errors.push(`Error fetching notifications: ${notificationsError.message}`)
    } else {
      results.notifications = notificationsData || []
    }

    // 7. Check for activity logs
    const { data: activitiesData, error: activitiesError } = await supabase
      .from("activities")
      .select("*")
      .eq("entity_id", employeeId.toString())
      .eq("action_type", "auto_reassign")
      .order("created_at", { ascending: false })
      .limit(5)

    if (activitiesError) {
      results.errors.push(`Error fetching activities: ${activitiesError.message}`)
    } else {
      results.activities = activitiesData || []
    }

    // 8. Determine success
    results.success = results.errors.length === 0 && leadCountBefore > 0 && results.affectedLeads.length > 0

    return results
  } catch (error) {
    results.errors.push(`Unexpected error: ${error.message}`)
    return results
  }
}
