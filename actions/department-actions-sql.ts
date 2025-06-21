"use server"

import { query } from "@/lib/postgresql-client"

export async function getDepartmentDistributionWithSQL() {
  try {
    console.log("📊 [DEPARTMENTS] Fetching department distribution using PostgreSQL...")

    // Get department counts using PostgreSQL JOIN
    const departmentResult = await query(`
      SELECT 
        d.name as department,
        COUNT(e.id) as count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id
      GROUP BY d.id, d.name
      ORDER BY d.name ASC
    `)

    // Transform the data into the format expected by the chart
    const result = departmentResult.rows.map((item) => ({
      department: item.department,
      count: parseInt(item.count) || 0,
    }))

    // Get count of employees with no department
    const noDeptResult = await query(`
      SELECT COUNT(*) as count
      FROM employees 
      WHERE department_id IS NULL
    `)

    const noDeptCount = parseInt(noDeptResult.rows[0]?.count) || 0
    if (noDeptCount > 0) {
      result.push({
        department: "No Department",
        count: noDeptCount,
      })
    }

    // Sort by count descending
    const sortedResult = result.sort((a, b) => b.count - a.count)
    
    console.log(`✅ [DEPARTMENTS] Fetched distribution for ${sortedResult.length} departments via PostgreSQL`)
    return sortedResult
  } catch (error) {
    console.error("❌ [DEPARTMENTS] Error in getDepartmentDistributionWithSQL:", error)
    return getFallbackDepartmentData()
  }
}

// Separate function for fallback data to maintain consistency
function getFallbackDepartmentData() {
  console.log("⚠️ [DEPARTMENTS] Using fallback department data")
  return [
    { department: "Engineering", count: 24 },
    { department: "Marketing", count: 13 },
    { department: "Sales", count: 18 },
    { department: "Finance", count: 8 },
    { department: "HR", count: 5 },
  ]
}
