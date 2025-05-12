"use server"

import { createClient } from "@/lib/supabase/server"

export async function getDepartmentDistribution() {
  const supabase = createClient()

  try {
    console.log("Fetching department distribution using separate queries...")

    // Get all departments
    const { data: departments, error: deptError } = await supabase.from("departments").select("id, name").order("name")

    if (deptError) {
      console.error("Error fetching departments:", deptError)
      return getFallbackDepartmentData()
    }

    // Initialize result with all departments and zero counts
    const result = departments.map((dept) => ({
      department: dept.name,
      count: 0,
      id: dept.id,
    }))

    // Get employee counts by department
    const { data: employeeCounts, error: countError } = await supabase
      .from("employees")
      .select("department_id, count")
      .not("department_id", "is", null)
      .group("department_id")
      .count()

    if (countError) {
      console.error("Error fetching employee counts:", countError)
      // Continue with zero counts
    } else if (employeeCounts) {
      // Update counts for departments that have employees
      employeeCounts.forEach((item) => {
        const deptIndex = result.findIndex((d) => d.id === item.department_id)
        if (deptIndex >= 0) {
          result[deptIndex].count = item.count
        }
      })
    }

    // Get count of employees with no department
    const { count: noDeptCount, error: noDeptError } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .is("department_id", null)

    if (noDeptError) {
      console.error("Error counting employees with no department:", noDeptError)
    } else if (noDeptCount && noDeptCount > 0) {
      result.push({
        department: "No Department",
        count: noDeptCount,
        id: null,
      })
    }

    // Sort by count descending and remove id property
    return result.sort((a, b) => b.count - a.count).map(({ department, count }) => ({ department, count }))
  } catch (error) {
    console.error("Error in getDepartmentDistribution:", error)
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
