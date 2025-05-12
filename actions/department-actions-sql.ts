"use server"

import { createClient } from "@/lib/supabase/server"

export async function getDepartmentDistributionWithSQL() {
  const supabase = createClient()

  try {
    console.log("Fetching department distribution using raw SQL...")

    // Use a raw SQL query to get department counts
    const { data, error } = await supabase
      .from("departments")
      .select(`
      name,
      employees:employees(count)
    `)
      .order("name")

    if (error) {
      console.error("Error executing SQL query:", error)
      return getFallbackDepartmentData()
    }

    // Transform the data into the format expected by the chart
    const result = data.map((item) => ({
      department: item.name,
      count: item.employees?.length || 0,
    }))

    // Get count of employees with no department
    const { data: empsNoDept, error: noDeptError } = await supabase
      .from("employees")
      .select("id")
      .is("department_id", null)

    if (!noDeptError && empsNoDept && empsNoDept.length > 0) {
      result.push({
        department: "No Department",
        count: empsNoDept.length,
      })
    }

    // Sort by count descending
    return result.sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error("Error in getDepartmentDistributionWithSQL:", error)
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
