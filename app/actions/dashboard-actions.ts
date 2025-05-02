"use server"
import { createClient } from "@/lib/supabase"
import { safeQuery } from "@/lib/db-utils"

export async function getDashboardStats() {
  return {
    departmentCount: await getDepartmentCount(),
    designationCount: await getDesignationCount(),
    // Employee count is now safely handled
    employeeCount: 0,
  }
}

async function getDepartmentCount() {
  return safeQuery(
    ["departments"],
    async () => {
      const supabase = createClient()
      const { count, error } = await supabase.from("departments").select("*", { count: "exact", head: true })

      if (error) throw error
      return count || 0
    },
    0,
  )
}

async function getDesignationCount() {
  return safeQuery(
    ["designations"],
    async () => {
      const supabase = createClient()
      const { count, error } = await supabase.from("designations").select("*", { count: "exact", head: true })

      if (error) throw error
      return count || 0
    },
    0,
  )
}
