"use server"

import { createClient } from "@/lib/supabase/server"

export async function getEmployeeStats() {
  const supabase = createClient()

  // Get total employees
  const { count: totalEmployees } = await supabase.from("employees").select("*", { count: "exact", head: true })

  // Get active employees
  const { count: activeEmployees } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  // Get inactive employees
  const { count: inactiveEmployees } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("status", "inactive")

  // Get on leave employees
  const { count: onLeaveEmployees } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("status", "on_leave")

  // Get terminated employees
  const { count: terminatedEmployees } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("status", "terminated")

  // Calculate average tenure
  const { data: employees } = await supabase
    .from("employees")
    .select("hire_date, termination_date")
    .not("hire_date", "is", null)

  let totalTenure = 0
  let employeesWithTenure = 0

  if (employees && employees.length > 0) {
    const now = new Date()

    employees.forEach((employee) => {
      if (employee.hire_date) {
        const hireDate = new Date(employee.hire_date)
        const endDate = employee.termination_date ? new Date(employee.termination_date) : now

        // Calculate tenure in months
        const tenureMonths =
          (endDate.getFullYear() - hireDate.getFullYear()) * 12 + (endDate.getMonth() - hireDate.getMonth())

        totalTenure += tenureMonths
        employeesWithTenure++
      }
    })
  }

  const averageTenure = employeesWithTenure > 0 ? totalTenure / employeesWithTenure : 0

  return {
    totalEmployees: totalEmployees || 0,
    activeEmployees: activeEmployees || 0,
    inactiveEmployees: inactiveEmployees || 0,
    onLeaveEmployees: onLeaveEmployees || 0,
    terminatedEmployees: terminatedEmployees || 0,
    averageTenure,
  }
}

export async function getDepartmentDistribution() {
  const supabase = createClient()

  // Get departments
  const { data: departments } = await supabase.from("departments").select("id, name")

  if (!departments || departments.length === 0) {
    return []
  }

  // Create a map of department IDs to names
  const departmentMap = new Map(departments.map((dept) => [dept.id, dept.name]))

  // Get employee counts by department
  const { data: counts } = await supabase
    .from("employees")
    .select("department_id, count")
    .not("department_id", "is", null)
    .group("department_id")
    .count()

  // Get count of employees with no department
  const { count: noDepartmentCount } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .is("department_id", null)

  // Format the data
  const result =
    counts?.map((item) => ({
      name: departmentMap.get(item.department_id) || "Unknown",
      count: item.count,
    })) || []

  // Add employees with no department
  if (noDepartmentCount && noDepartmentCount > 0) {
    result.push({
      name: "No Department",
      count: noDepartmentCount,
    })
  }

  return result
}

export async function getStatusDistribution() {
  const supabase = createClient()

  // Get employee counts by status
  const { data: counts } = await supabase.from("employees").select("status, count").group("status").count()

  // Format the data
  return (
    counts?.map((item) => ({
      status: item.status || "unknown",
      count: item.count,
    })) || []
  )
}

export async function getRecentEmployees(limit = 5) {
  const supabase = createClient()

  // Get recent employees
  const { data: employees } = await supabase
    .from("employees")
    .select(`
      *,
      departments(name)
    `)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (!employees) {
    return []
  }

  // Format the data
  return employees.map((employee) => ({
    ...employee,
    department_name: employee.departments?.name || null,
  }))
}
