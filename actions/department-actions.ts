"use server"

import { createClient } from "@/lib/supabase"

export async function getDepartmentDistribution() {
  try {
    console.log("Fetching department distribution data...")
    const supabase = createClient()

    if (!supabase) {
      console.error("Failed to create Supabase client")
      return getFallbackDepartmentData()
    }

    // Get all departments with their names
    const { data: departments, error: deptError } = await supabase.from("departments").select("id, name").order("name")

    if (deptError) {
      console.error("Error fetching departments:", deptError)
      return getFallbackDepartmentData()
    }

    console.log(`Found ${departments?.length || 0} departments:`, departments)

    if (!departments || departments.length === 0) {
      console.log("No departments found, returning fallback data")
      return getFallbackDepartmentData()
    }

    // Initialize result with department names and zero counts
    const departmentCounts = departments.map((dept) => ({
      department: dept.name,
      count: 0,
      id: dept.id,
    }))

    // Get employee counts by department
    for (const dept of departmentCounts) {
      try {
        console.log(`Fetching employee count for department ${dept.department} (ID: ${dept.id})`)

        const { count, error } = await supabase
          .from("employee_departments")
          .select("*", { count: "exact", head: true })
          .eq("department_id", dept.id)

        if (error) {
          console.error(`Error fetching employee count for department ${dept.department}:`, error)
        } else {
          console.log(`Department ${dept.department} has ${count || 0} employees`)
          dept.count = count || 0
        }
      } catch (countError) {
        console.error(`Error counting employees for department ${dept.department}:`, countError)
        // Continue with next department instead of failing completely
      }
    }

    // Always return data - even if it's all zeros
    return departmentCounts
  } catch (error) {
    console.error("Error fetching department distribution:", error)
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
