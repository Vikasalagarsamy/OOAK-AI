import { supabase } from "@/lib/supabase"

export async function generateClientCode(companyId: number): Promise<string> {
  try {
    // Get the company code
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single()

    if (companyError) {
      throw companyError
    }

    // Determine which column to use for company code
    let companyCode = ""
    if ("company_code" in companyData) {
      companyCode = companyData.company_code
    } else if ("code" in companyData) {
      companyCode = companyData.code
    } else {
      // If no code column is found, use the first two letters of the company name or ID
      const nameColumn =
        "company_name" in companyData
          ? "company_name"
          : "name" in companyData
            ? "name"
            : "title" in companyData
              ? "title"
              : null

      if (nameColumn && companyData[nameColumn]) {
        companyCode = companyData[nameColumn].substring(0, 2).toUpperCase()
      } else {
        companyCode = `CO${companyId}`
      }
    }

    // Find the highest existing client code number for this company
    const prefix = `C${companyCode}`
    const { data: existingClients, error: clientsError } = await supabase
      .from("clients")
      .select("client_code")
      .eq("company_id", companyId)
      .ilike("client_code", `${prefix}%`)
      .order("client_code", { ascending: false })
      .limit(1)

    if (clientsError) {
      throw clientsError
    }

    let nextNumber = 1

    if (existingClients && existingClients.length > 0) {
      // Extract the number from the highest existing code
      const highestCode = existingClients[0].client_code
      const match = highestCode.match(/\d+$/)

      if (match) {
        nextNumber = Number.parseInt(match[0], 10) + 1
      }
    }

    // Generate the client code with padded number
    const paddedNumber = nextNumber.toString().padStart(3, "0")
    return `${prefix}${paddedNumber}`
  } catch (error) {
    console.error("Error generating client code:", error)
    // Fallback to a unique code if there's an error
    return `C${companyId}${Date.now().toString().slice(-6)}`
  }
}

// Function to ensure a unique client code by checking if it exists
export async function ensureUniqueClientCode(baseCode: string): Promise<string> {
  let attemptCount = 0
  let clientCode = baseCode

  while (attemptCount < 10) {
    // Limit retries to avoid infinite loops
    // Check if the code already exists
    const { count, error } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("client_code", clientCode)

    if (error) {
      throw error
    }

    if (count === 0) {
      // Code is unique, return it
      return clientCode
    }

    // Code exists, append a random suffix and try again
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    clientCode = `${baseCode}-${randomSuffix}`
    attemptCount++
  }

  // If we've tried too many times, use timestamp for guaranteed uniqueness
  return `${baseCode}-${Date.now().toString().slice(-6)}`
}
