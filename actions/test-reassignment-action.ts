"use server"

import { testLeadReassignment } from "@/utils/test-lead-reassignment"

export async function testReassignmentAction(employeeId: number, newStatus: string) {
  try {
    const results = await testLeadReassignment(employeeId, newStatus)
    return {
      success: results.success,
      message: results.success
        ? `Successfully reassigned ${results.affectedLeads.length} leads`
        : `Test failed: ${results.errors.join(", ")}`,
      details: results,
    }
  } catch (error) {
    return {
      success: false,
      message: `Error executing test: ${error.message}`,
      details: null,
    }
  }
}
