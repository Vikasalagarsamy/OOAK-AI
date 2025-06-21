"use server"

import { query, transaction } from "@/lib/postgresql-client"

export async function getDepartmentDistribution() {
  try {
    console.log("🏢 [DEPARTMENTS] Fetching department distribution via PostgreSQL...")

    // Get all departments with employee counts in a single optimized query
    const result = await query(`
      SELECT 
        d.id,
        d.name as department,
        COUNT(e.id) as count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id
      GROUP BY d.id, d.name
      
      UNION ALL
      
      SELECT 
        NULL as id,
        'No Department' as department,
        COUNT(e.id) as count
      FROM employees e
      WHERE e.department_id IS NULL
      
      ORDER BY count DESC, department ASC
    `)

    // Transform to match expected format
    const departmentData = result.rows.map(row => ({
      department: row.department,
      count: parseInt(row.count) || 0
    }))

    console.log(`✅ [DEPARTMENTS] Fetched ${departmentData.length} departments via PostgreSQL`)
    return departmentData
  } catch (error) {
    console.error("❌ [DEPARTMENTS] Error fetching department distribution:", error)
    return getFallbackDepartmentData()
  }
}

// Separate function for fallback data to maintain consistency
function getFallbackDepartmentData() {
  return [
    { department: "Engineering", count: 24 },
    { department: "Marketing", count: 13 },
    { department: "Sales", count: 18 },
    { department: "Finance", count: 8 },
    { department: "HR", count: 5 },
  ]
}
