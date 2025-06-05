"use server"

import { createClient } from "@/lib/supabase/server"
import type { Employee } from "@/types/employee"
import { triggerLeadAssignmentTasks } from '@/actions/lead-task-integration-hooks'

// Replace the getEmployeesForLeadAssignment function with this fixed version
export async function getEmployeesForLeadAssignment(
  companyId?: number | undefined,
  branchId?: number | undefined,
  roleFilter = "Sales",
): Promise<Employee[]> {
  const supabase = createClient()

  try {
    console.log(
      `Fetching employees for lead assignment - Company: ${companyId}, Branch: ${branchId}, Role: ${roleFilter}`,
    )

    // First, get all active employees
    const { data: allEmployees, error: employeesError } = await supabase
      .from("employees")
      .select(`
        id, 
        employee_id, 
        first_name, 
        last_name, 
        job_title, 
        status, 
        department_id,
        departments(name),
        designations(name)
      `)
      .eq("status", "active")
      .order("first_name")

    if (employeesError) {
      console.error("Error fetching employees:", employeesError)
      return []
    }

    // Get all employee allocations
    const { data: allAllocations, error: allocationsError } = await supabase
      .from("employee_companies")
      .select(`
        id,
        employee_id,
        company_id,
        branch_id,
        project_id,
        allocation_percentage,
        is_primary,
        start_date,
        end_date,
        status
      `)
      .is("end_date", null) // Only get active allocations (no end date)
      .order("is_primary", { ascending: false })

    if (allocationsError) {
      console.error("Error fetching employee allocations:", allocationsError)
      return []
    }

    // Get all departments to identify sales departments
    const { data: departments, error: departmentsError } = await supabase.from("departments").select("id, name")

    if (departmentsError) {
      console.error("Error fetching departments:", departmentsError)
      return []
    }

    // Identify sales department IDs
    const salesDepartmentIds = departments
      .filter((dept) => dept.name.toLowerCase().includes("sales"))
      .map((dept) => dept.id)

    console.log(`Identified sales department IDs: ${salesDepartmentIds.join(", ")}`)

    // Filter employees based on allocations and role
    let eligibleEmployees = allEmployees.map((emp) => {
      // Get all allocations for this employee
      const employeeAllocations = allAllocations.filter((alloc) => alloc.employee_id === emp.id)

      // Check if employee has an allocation to the specified company
      const hasCompanyAllocation = !companyId || employeeAllocations.some((alloc) => alloc.company_id === companyId)

      // Check if employee has an allocation to the specified branch
      const hasBranchAllocation = !branchId || employeeAllocations.some((alloc) => alloc.branch_id === branchId)

      // Check if employee is in a sales role
      const isSalesRole =
        // Check job title
        (emp.job_title && emp.job_title.toLowerCase().includes("sales")) ||
        // Check department
        (emp.departments && emp.departments.name.toLowerCase().includes("sales")) ||
        // Check department ID
        (emp.department_id && salesDepartmentIds.includes(emp.department_id)) ||
        // Check designation
        (emp.designations && emp.designations.name.toLowerCase().includes("sales"))

      // Format the employee data with allocation information
      return {
        id: emp.id,
        employee_id: emp.employee_id,
        name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
        first_name: emp.first_name,
        last_name: emp.last_name,
        full_name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
        job_title: emp.job_title || "",
        department: emp.departments?.name || "",
        designation: emp.designations?.name || "",
        status: emp.status || "active",
        is_sales: isSalesRole,
        allocations: employeeAllocations,
        hasCompanyAllocation,
        hasBranchAllocation,
        // Find the relevant allocation for this company/branch
        relevantAllocation: employeeAllocations.find(
          (alloc) => (!companyId || alloc.company_id === companyId) && (!branchId || alloc.branch_id === branchId),
        ),
        // Primary allocation
        primaryAllocation: employeeAllocations.find((alloc) => alloc.is_primary),
      }
    })

    // Apply filters
    eligibleEmployees = eligibleEmployees.filter((emp) => {
      // Must be in sales role if roleFilter is specified
      if (roleFilter && roleFilter.toLowerCase() === "sales" && !emp.is_sales) {
        return false
      }

      // Must have allocation to the specified company if companyId is provided
      if (companyId && !emp.hasCompanyAllocation) {
        return false
      }

      // Must have allocation to the specified branch if branchId is provided
      if (branchId && !emp.hasBranchAllocation) {
        return false
      }

      return true
    })

    // Sort employees: prioritize those with direct allocations to the company/branch
    eligibleEmployees.sort((a, b) => {
      // First priority: has relevant allocation
      if (a.relevantAllocation && !b.relevantAllocation) return -1
      if (!a.relevantAllocation && b.relevantAllocation) return 1

      // Second priority: is primary allocation
      if (a.relevantAllocation?.is_primary && !b.relevantAllocation?.is_primary) return -1
      if (!a.relevantAllocation?.is_primary && b.relevantAllocation?.is_primary) return 1

      // Third priority: allocation percentage (higher first)
      if (a.relevantAllocation && b.relevantAllocation) {
        return (b.relevantAllocation.allocation_percentage || 0) - (a.relevantAllocation.allocation_percentage || 0)
      }

      // Fourth priority: alphabetical by name
      return a.name.localeCompare(b.name)
    })

    console.log(`Found ${eligibleEmployees.length} eligible employees for lead assignment`)

    // Format the final result
    return eligibleEmployees.map((emp) => ({
      id: emp.id,
      employee_id: emp.employee_id,
      name: emp.name,
      first_name: emp.first_name,
      last_name: emp.last_name,
      full_name: emp.full_name,
      job_title: emp.job_title,
      role: emp.job_title,
      department: emp.department,
      designation: emp.designation,
      status: emp.status,
      is_sales: emp.is_sales,
      is_primary: emp.relevantAllocation?.is_primary || false,
      allocation_percentage: emp.relevantAllocation?.allocation_percentage || 0,
      company_id: emp.relevantAllocation?.company_id || emp.primaryAllocation?.company_id,
      branch_id: emp.relevantAllocation?.branch_id || emp.primaryAllocation?.branch_id,
    }))
  } catch (error) {
    console.error("Exception in getEmployeesForLeadAssignment:", error)
    return []
  }
}

// Update the assignLeadToEmployee function
export async function assignLeadToEmployee(
  leadId: number,
  employeeId: number,
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    console.log(`Assigning lead ${leadId} to employee ${employeeId}`)

    // Get the lead details first
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single()

    if (leadError) {
      console.error("Error fetching lead:", leadError)
      return { success: false, message: `Failed to fetch lead: ${leadError.message}` }
    }

    // Get the employee details
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, first_name, last_name, status")
      .eq("id", employeeId)
      .single()

    if (employeeError) {
      console.error("Error fetching employee:", employeeError)
      return { success: false, message: `Failed to fetch employee: ${employeeError.message}` }
    }

    // Verify employee is active
    if (employee.status !== "active") {
      return {
        success: false,
        message: `Cannot assign lead to inactive employee: ${employee.first_name} ${employee.last_name}`,
      }
    }

    // Check if employee has allocation to the lead's company
    if (lead.company_id) {
      const { data: allocations, error: allocError } = await supabase
        .from("employee_companies")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("company_id", lead.company_id)
        .is("end_date", null) // Only active allocations

      if (allocError) {
        console.error("Error checking employee allocation:", allocError)
      } else if (!allocations || allocations.length === 0) {
        console.warn(
          `Employee ${employeeId} has no allocation to company ${lead.company_id}, but proceeding with assignment`,
        )
      }
    }

    // Update the lead
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        assigned_to: employeeId,
        status: "ASSIGNED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (updateError) {
      console.error("Error assigning lead:", updateError)
      return { success: false, message: `Failed to assign lead: ${updateError.message}` }
    }

    // 🤖 TRIGGER AI TASK GENERATION
    try {
      const updatedLeadData = {
        ...lead,
        assigned_to: employeeId,
        status: "ASSIGNED",
        updated_at: new Date().toISOString()
      }
      
      console.log('🚀 Triggering AI task generation for lead assignment...')
      const aiResult = await triggerLeadAssignmentTasks(
        leadId,
        updatedLeadData,
        `${employee.first_name} ${employee.last_name} Assignment`
      )
      
      if (aiResult.success && aiResult.tasksGenerated > 0) {
        console.log(`✅ AI generated ${aiResult.tasksGenerated} task(s) for lead ${leadId}`)
      } else {
        console.log(`ℹ️ No AI tasks generated for lead ${leadId}: ${aiResult.message}`)
      }
    } catch (aiError) {
      console.error('⚠️ AI task generation failed (continuing with assignment):', aiError)
      // Don't fail the entire assignment if AI task generation fails
    }

    // Log the assignment in the activity log if the table exists
    try {
      const { data: tableExists } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_name", "activity_log")
        .maybeSingle()

      if (tableExists) {
        await supabase.from("activity_log").insert({
          activity_type: "lead_assignment",
          entity_type: "lead",
          entity_id: leadId,
          user_id: null, // System action
          description: `Lead #${leadId} assigned to ${employee.first_name} ${employee.last_name}`,
          created_at: new Date().toISOString(),
        })
      }
    } catch (logError) {
      console.error("Error logging activity:", logError)
      // Don't fail the assignment if logging fails
    }

    return {
      success: true,
      message: `Lead successfully assigned to ${employee.first_name} ${employee.last_name}`,
    }
  } catch (error) {
    console.error("Exception assigning lead:", error)
    return { success: false, message: `An unexpected error occurred: ${error}` }
  }
}
