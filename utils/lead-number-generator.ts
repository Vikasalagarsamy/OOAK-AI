import { createClient } from "@/lib/supabase"

export async function generateLeadNumber(): Promise<string> {
  try {
    const supabase = createClient()

    // Get the current highest lead number
    const { data, error } = await supabase
      .from("leads")
      .select("lead_number")
      .order("lead_number", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Error fetching lead numbers:", error)
      return "L0001" // Default if error
    }

    let nextNumber = 1

    if (data && data.length > 0) {
      // Extract the numeric part of the lead number
      const lastLeadNumber = data[0].lead_number
      const matches = lastLeadNumber.match(/L(\d+)/)

      if (matches && matches[1]) {
        nextNumber = Number.parseInt(matches[1], 10) + 1
      }
    }

    // Format with leading zeros (L0001, L0002, etc.)
    return `L${nextNumber.toString().padStart(4, "0")}`
  } catch (error) {
    console.error("Exception generating lead number:", error)
    return "L0001" // Default if exception
  }
}

export async function ensureUniqueLeadNumber(leadNumber: string): Promise<string> {
  try {
    const supabase = createClient()

    // Check if the lead number already exists
    const { data, error } = await supabase.from("leads").select("lead_number").eq("lead_number", leadNumber).limit(1)

    if (error) {
      console.error("Error checking lead number uniqueness:", error)
      return leadNumber // Return original if error
    }

    // If the lead number exists, recursively generate a new one
    if (data && data.length > 0) {
      const matches = leadNumber.match(/L(\d+)/)

      if (matches && matches[1]) {
        const nextNumber = Number.parseInt(matches[1], 10) + 1
        const newLeadNumber = `L${nextNumber.toString().padStart(4, "0")}`
        return ensureUniqueLeadNumber(newLeadNumber)
      }
    }

    return leadNumber // Return original if unique
  } catch (error) {
    console.error("Exception ensuring unique lead number:", error)
    return leadNumber // Return original if exception
  }
}
