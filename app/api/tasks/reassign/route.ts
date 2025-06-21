import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'
import { getCurrentUser } from '@/actions/auth-actions'

// POST /api/tasks/reassign - Reassign task and associated lead to a new employee
export async function POST(request: NextRequest) {
  try {
    const { query, transaction } = createClient()
    const { taskId, newEmployeeId } = await request.json()
    
    // Get current user for authorization
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }
    
    console.log(`🔄 Reassigning task ${taskId} to employee ${newEmployeeId} by user ${currentUser.username}`)
    
    // Validate input
    if (!taskId || !newEmployeeId) {
      return NextResponse.json(
        { error: 'Missing required fields: taskId and newEmployeeId' },
        { status: 400 }
      )
    }
    
    // Get the task details first
    const { data: task, error: taskError } = await supabase
      .from('ai_tasks')
      .select('*')
      .eq('id', taskId)
      .single()
    
    if (taskError) {
      console.error('❌ Error fetching task:', taskError)
      return NextResponse.json(
        { error: 'Task not found', details: taskError.message },
        { status: 404 }
      )
    }
    
    // Get the new employee details
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, status, employee_id')
      .eq('id', newEmployeeId)
      .single()
    
    if (employeeError || !employee) {
      console.error('❌ Error fetching employee:', employeeError)
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }
    
    // Check if employee is active
    if (employee.status !== 'active') {
      return NextResponse.json(
        { error: `Cannot reassign to inactive employee: ${employee.first_name} ${employee.last_name}` },
        { status: 400 }
      )
    }
    
    console.log(`📋 Task details: ${task.task_title} (Lead ID: ${task.lead_id})`)
    console.log(`👤 New assignee: ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`)
    
    // Update the task
    const { error: updateTaskError } = await supabase
      .from('ai_tasks')
      .update({
        assigned_to_employee_id: newEmployeeId,
        assigned_to: `${employee.first_name} ${employee.last_name}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
    
    if (updateTaskError) {
      console.error('❌ Error updating task:', updateTaskError)
      return NextResponse.json(
        { error: 'Failed to reassign task', details: updateTaskError.message },
        { status: 500 }
      )
    }
    
    console.log('✅ Task reassigned successfully')
    
    // If the task has an associated lead, reassign the lead too
    let leadReassigned = false
    if (task.lead_id) {
      console.log(`🔄 Also reassigning associated lead ${task.lead_id} to ${employee.first_name} ${employee.last_name}`)
      
      const { error: updateLeadError } = await supabase
        .from('leads')
        .update({
          assigned_to: newEmployeeId,
          updated_at: new Date().toISOString(),
          is_reassigned: true,
          reassigned_at: new Date().toISOString(),
          reassigned_by: currentUser.employeeId
        })
        .eq('id', task.lead_id)
      
      if (updateLeadError) {
        console.error('⚠️ Error updating lead (task was reassigned):', updateLeadError)
        // Don't fail the entire operation if lead update fails
      } else {
        leadReassigned = true
        console.log('✅ Associated lead reassigned successfully')
      }
    }

    // If the task has an associated quotation, reassign the quotation too
    let quotationReassigned = false
    if (task.quotation_id) {
      console.log(`🔄 Also reassigning associated quotation ${task.quotation_id} to employee ID ${employee.id}`)
      
      const { error: updateQuotationError } = await supabase
        .from('quotations')
        .update({
          created_by: employee.id, // Use the employee.id (which is the employee_id in our database)
          updated_at: new Date().toISOString()
        })
        .eq('id', task.quotation_id)
      
      if (updateQuotationError) {
        console.error('⚠️ Error updating quotation (task was reassigned):', updateQuotationError)
        // Don't fail the entire operation if quotation update fails
      } else {
        quotationReassigned = true
        console.log('✅ Associated quotation reassigned successfully')
      }
    }
    
    // Log the activity
    try {
      const additionalItems = []
      if (leadReassigned) additionalItems.push('lead')
      if (quotationReassigned) additionalItems.push('quotation')
      const additionalText = additionalItems.length > 0 ? ` (with associated ${additionalItems.join(' and ')})` : ''
      
      const activityData = {
        activity_type: 'task_reassignment',
        entity_type: 'task',
        entity_id: taskId.toString(),
        description: `Task "${task.task_title}" reassigned from ${task.assigned_to} to ${employee.first_name} ${employee.last_name}${additionalText}`,
        created_at: new Date().toISOString()
      }
      
      await query(`INSERT INTO ${table} VALUES ${values}`)
    } catch (logError) {
      console.error('⚠️ Error logging activity:', logError)
      // Don't fail the operation if logging fails
    }
    
    return NextResponse.json({
      success: true,
      message: `Task reassigned to ${employee.first_name} ${employee.last_name}`,
      taskReassigned: true,
      leadReassigned,
      quotationReassigned,
      employee: {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        employee_id: employee.employee_id
      }
    })
    
  } catch (error: any) {
    console.error('❌ Exception in task reassignment:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/tasks/reassign - Get available employees for reassignment
export async function GET(request: NextRequest) {
  try {
    const { query, transaction } = createClient()
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    
    // Get current user for authorization
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }
    
    // Get task details to determine branch/company for finding available employees
    let companyId = null
    let branchId = null
    let leadCompanyName = null
    
    if (taskId) {
      // First get the task
      const { data: task, error: taskError } = await supabase
        .from('ai_tasks')
        .select('id, lead_id, task_title')
        .eq('id', taskId)
        .single()
      
              // Then get the lead details separately if task has a lead
        let leadData = null
        if (!taskError && task?.lead_id) {
          const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('id, company_id, branch_id, client_name')
            .eq('id', task.lead_id)
            .single()
          
          if (!leadError && lead) {
            // Get company details separately
            let companyData = null
            if (lead.company_id) {
              const { data: company, error: compError } = await supabase
                .from('companies')
                .select('id, name')
                .eq('id', lead.company_id)
                .single()
              
              if (!compError) {
                companyData = company
              }
            }
            
            leadData = {
              ...lead,
              company: companyData
            }
          }
        }
      
              if (!taskError && leadData) {
          companyId = leadData.company_id
          branchId = leadData.branch_id
          leadCompanyName = leadData.company?.name
          
          console.log(`📍 Task ${taskId} is associated with lead ${leadData.id} (${leadData.client_name}) from company: ${leadCompanyName} (ID: ${companyId})`)
        } else {
          // No lead associated - fallback to current user's company for filtering
          console.log(`⚠️ Task ${taskId} has no associated lead, using current user's company for filtering`)
          
          const { data: currentEmployee, error: empError } = await supabase
            .from('employees')
            .select(`
              id, employee_companies(company_id, is_primary, companies(id, name))
            `)
            .eq('id', currentUser.employeeId)
            .single()
          
          if (!empError && currentEmployee?.employee_companies) {
            const allocations = Array.isArray(currentEmployee.employee_companies) 
              ? currentEmployee.employee_companies 
              : [currentEmployee.employee_companies]
            
            // Use primary company or first company
            const primaryAllocation = allocations.find(alloc => alloc.is_primary) || allocations[0]
            if (primaryAllocation) {
              companyId = primaryAllocation.company_id
              const company = Array.isArray(primaryAllocation.companies) 
                ? primaryAllocation.companies[0] 
                : primaryAllocation.companies
              leadCompanyName = company?.name
              
              console.log(`📍 Using current user's company: ${leadCompanyName} (ID: ${companyId})`)
            }
          }
        }
    }
    
    // Get all active employees with their company allocations
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select(`
        id, first_name, last_name, employee_id, status, job_title,
        employee_companies(company_id, branch_id, is_primary, companies(id, name)),
        designations(name)
      `)
      .eq('status', 'active')
      .order('first_name')
    
    if (employeesError) {
      console.error('❌ Error fetching employees:', employeesError)
      return NextResponse.json(
        { error: 'Failed to fetch employees', details: employeesError.message },
        { status: 500 }
      )
    }
    
    // Filter and format SALES employees only
    const salesEmployees = employees?.filter(emp => {
      // Check if employee is in sales role
      const isSalesRole = 
        // Check job title for sales-related keywords
        (emp.job_title && (
          emp.job_title.toLowerCase().includes('sales') ||
          emp.job_title.toLowerCase().includes('account manager') ||
          emp.job_title.toLowerCase().includes('business development') ||
          emp.job_title.toLowerCase().includes('sales executive') ||
          emp.job_title.toLowerCase().includes('sales manager')
        )) ||
        // Check designation for sales-related keywords  
        (emp.designations && 
          typeof emp.designations === 'object' && 
          'name' in emp.designations && 
          typeof emp.designations.name === 'string' && (
            emp.designations.name.toLowerCase().includes('sales') ||
            emp.designations.name.toLowerCase().includes('account manager') ||
            emp.designations.name.toLowerCase().includes('business development')
          ))
      
      return isSalesRole
    }) || []

    // Map and prioritize employees by company match
    const availableEmployees = salesEmployees.map(emp => {
      const designation = Array.isArray(emp.designations) ? emp.designations[0] : emp.designations
      const allocations = Array.isArray(emp.employee_companies) ? emp.employee_companies : (emp.employee_companies ? [emp.employee_companies] : [])
      
      // Check if employee is allocated to the lead's company
      const hasLeadCompanyAllocation = companyId ? allocations.some(alloc => alloc.company_id === companyId) : false
      const leadCompanyAllocation = allocations.find(alloc => alloc.company_id === companyId)
      
      // Get primary allocation info
      const primaryAllocation = allocations.find(alloc => alloc.is_primary) || allocations[0]
      const primaryCompany = Array.isArray(primaryAllocation?.companies) ? primaryAllocation.companies[0] : primaryAllocation?.companies
      
      return {
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        employee_id: emp.employee_id,
        job_title: emp.job_title,
        designation: designation?.name,
        company_id: primaryAllocation?.company_id,
        company_name: primaryCompany?.name,
        branch_id: primaryAllocation?.branch_id,
        is_primary: primaryAllocation?.is_primary,
        hasLeadCompanyAllocation,
        leadCompanyAllocation: hasLeadCompanyAllocation ? leadCompanyAllocation : null,
        // Priority score for sorting (higher = better match)
        priority: hasLeadCompanyAllocation ? 10 : 0
      }
    })
    
    // Sort by priority (company match first) then by name
    .sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority
      return a.name.localeCompare(b.name)
    })
    
    // Filter to only show employees from the target company if we have company info
    let filteredEmployees = availableEmployees
    if (companyId) {
      const companyMatches = availableEmployees.filter(emp => emp.hasLeadCompanyAllocation)
      if (companyMatches.length > 0) {
        filteredEmployees = companyMatches
        console.log(`🎯 Applied company filter: showing only employees from company ID ${companyId}`)
      } else {
        console.log(`⚠️ No sales employees found for company ID ${companyId}, showing all sales employees`)
      }
    } else {
      console.log(`ℹ️ No company filter applied, showing all sales employees`)
    }
    
    console.log(`📋 Found ${filteredEmployees.length} available SALES employees for reassignment`)
    if (companyId && leadCompanyName) {
      console.log(`🎯 Filtered for company: ${leadCompanyName} (ID: ${companyId})`)
      console.log(`   Company matches: ${filteredEmployees.filter(emp => emp.hasLeadCompanyAllocation).length}`)
    }
    console.log('Available employees:', filteredEmployees.map(emp => `${emp.name} (${emp.job_title}${emp.company_name ? ' - ' + emp.company_name : ''})`).join(', '))
    
    return NextResponse.json({
      success: true,
      employees: filteredEmployees,
      filters: {
        companyId,
        branchId,
        leadCompanyName,
        totalSalesEmployees: availableEmployees.length,
        companyFilteredCount: filteredEmployees.length
      }
    })
    
  } catch (error: any) {
    console.error('❌ Exception getting available employees:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 