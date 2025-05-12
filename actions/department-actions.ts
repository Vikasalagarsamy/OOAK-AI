"use server"

import { createClient } from "@/lib/supabase/server"

export async function getDepartmentDistribution() {
  const supabase = createClient()

  try {
    console.log("Fetching department distribution using simplified RPC function...")

    // Use our updated RPC function with simplified return structure
    const { data: departmentCounts, error } = await supabase.rpc("get_employee_department_counts")

    if (error) {
      console.error("Error fetching department counts:", error)
      return getFallbackDepartmentData()
    }

    console.log("Department counts from RPC:", departmentCounts)

    // Transform the data into the format expected by the chart
    // Note: We no longer have department_id in the return value
    const result = departmentCounts.map((item) => ({
      department: item.department_name || "Unknown",
      count: Number(item.employee_count),
    }))

    // Sort by count descending for better visualization
    return result.sort((a, b) => b.count - a.count)
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

// Add a validation function to check data integrity
export async function validateDepartmentData() {
  const supabase = createClient()

  try {
    // Check for employees with invalid department IDs
    const { data: departments } = await supabase.from("departments").select("id")
    const departmentIds = departments?.map((d) => d.id) || []

    // Only run this check if we have departments
    if (departmentIds.length > 0) {
      const { data: invalidDeptEmployees, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, department_id")
        .not("department_id", "is", null)
        .not("department_id", "in", `(${departmentIds.join(",")})`)

      if (error) {
        console.error("Error checking for invalid department references:", error)
        return { valid: false, issues: ["Database query error"] }
      }

      if (invalidDeptEmployees && invalidDeptEmployees.length > 0) {
        return {
          valid: false,
          issues: [`Found ${invalidDeptEmployees.length} employees with invalid department references`],
          invalidEmployees: invalidDeptEmployees,
        }
      }
    }

    return { valid: true }
  } catch (error) {
    console.error("Error validating department data:", error)
    return { valid: false, issues: ["Exception during validation"] }
  }
}
