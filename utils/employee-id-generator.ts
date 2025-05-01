"use server"

import { createClient } from "@/lib/supabase/server"

export async function getNewEmployeeId(): Promise<string> {
  const supabase = createClient()

  // Get the current year
  const currentYear = new Date().getFullYear().toString().slice(-2)

  // Get the highest employee ID for the current year
  const { data, error } = await supabase
    .from("employees")
    .select("employee_id")
    .like("employee_id", `EMP-${currentYear}-%`)
    .order("employee_id", { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is the error code for "no rows returned"
    console.error("Error fetching latest employee ID:", error)
    // Default to 0001 if there's an error
    return `EMP-${currentYear}-0001`
  }

  if (!data) {
    // No employees for this year yet
    return `EMP-${currentYear}-0001`
  }

  // Extract the sequence number from the employee ID
  const match = data.employee_id.match(/EMP-\d{2}-(\d{4})/)
  if (!match) {
    // If the format doesn't match, start from 0001
    return `EMP-${currentYear}-0001`
  }

  // Increment the sequence number
  const sequenceNumber = Number.parseInt(match[1], 10) + 1
  const paddedSequence = sequenceNumber.toString().padStart(4, "0")

  return `EMP-${currentYear}-${paddedSequence}`
}
