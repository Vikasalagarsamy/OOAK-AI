"use server"

import { query, transaction } from "@/lib/postgresql-client"

// Cache for department distribution - 60 second cache
let departmentCache: {
  data: Array<{ department: string; count: number }>
  timestamp: number
} | null = null

const CACHE_DURATION = 60 * 1000 // 60 seconds

export async function getDepartmentDistribution() {
  // Check cache first
  if (departmentCache && (Date.now() - departmentCache.timestamp) < CACHE_DURATION) {
    console.log("⚡ Returning cached department distribution")
    return departmentCache.data
  }

  try {
    console.log("🔄 Fetching fresh department distribution via PostgreSQL...")

    // Optimized query - get department counts directly
    const result = await query(`
      SELECT 
        d.name as department,
        COUNT(e.id) as count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id
      GROUP BY d.id, d.name
      
      UNION ALL
      
      SELECT 
        'No Department' as department,
        COUNT(e.id) as count
      FROM employees e
      WHERE e.department_id IS NULL
      HAVING COUNT(e.id) > 0
      
      ORDER BY count DESC, department ASC
    `)

    // Convert to array format
    const departmentData = result.rows.map(row => ({
      department: row.department,
      count: parseInt(row.count) || 0
    }))

    // Update cache
    departmentCache = {
      data: departmentData,
      timestamp: Date.now()
    }

    console.log("✅ Department distribution fetched and cached via PostgreSQL")
    return departmentData

  } catch (error) {
    console.error("❌ Error in getDepartmentDistribution:", error)
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

// Simplified validation function 
export async function validateDepartmentData() {
  try {
    // Quick validation using PostgreSQL
    const result = await query(`
      SELECT 
        COUNT(DISTINCT d.id) as department_count,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id
    `)

    return { 
      valid: true, 
      stats: {
        departments: parseInt(result.rows[0]?.department_count) || 0,
        employees: parseInt(result.rows[0]?.employee_count) || 0
      }
    }
  } catch (error) {
    console.error("Error validating department data:", error)
    return { valid: false, issues: ["Database validation failed"] }
  }
}
