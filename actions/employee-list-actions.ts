"use server"

import { query, transaction } from "@/lib/postgresql-client"

export async function getEmployeesWithAllocations() {
  try {
    console.log('👥 [EMPLOYEE LIST] Fetching employees with allocations via PostgreSQL...')

    const result = await query(`
      SELECT 
        e.*,
        d.name as department_name,
        des.name as designation_name,
        b.name as home_branch_name,
        c.name as primary_company_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      LEFT JOIN branches b ON e.home_branch_id = b.id
      LEFT JOIN companies c ON e.primary_company_id = c.id
      ORDER BY e.created_at DESC
    `)

    if (!result.rows || result.rows.length === 0) {
      console.log('⚠️ [EMPLOYEE LIST] No employees found')
      return []
    }

    // Transform the data to include the related names
    const transformedData = result.rows.map((employee) => ({
      ...employee,
      departments: employee.department_name ? { name: employee.department_name } : null,
      designations: employee.designation_name ? { name: employee.designation_name } : null,
      branches: employee.home_branch_name ? { name: employee.home_branch_name } : null,
      companies: employee.primary_company_name ? { name: employee.primary_company_name } : null,
      department_name: employee.department_name || null,
      designation_name: employee.designation_name || null,
      home_branch_name: employee.home_branch_name || null,
      primary_company_name: employee.primary_company_name || null,
    }))

    console.log(`✅ [EMPLOYEE LIST] Fetched ${transformedData.length} employees via PostgreSQL`)
    return transformedData
  } catch (error) {
    console.error("❌ [EMPLOYEE LIST] Error fetching employees:", error)
    throw new Error(`Error fetching employees: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
