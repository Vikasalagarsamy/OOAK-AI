"use server"
import { createClient } from "@/lib/postgresql-unified"
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
      const { query, transaction } = createClient()
      const { count, error } = await query(`SELECT ${params} FROM ${table}`)

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
      const { query, transaction } = createClient()
      const { count, error } = await query(`SELECT ${params} FROM ${table}`)

      if (error) throw error
      return count || 0
    },
    0,
  )
}
