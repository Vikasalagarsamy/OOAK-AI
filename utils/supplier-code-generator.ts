import { supabase } from "@/lib/supabase"

export async function generateSupplierCode(): Promise<string> {
  // Get the current date components
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")

  // Format for the prefix of the code
  const prefix = `S-${year}-${month}`

  // Get the highest sequential number for this month
  const { data } = await supabase
    .from("suppliers")
    .select("supplier_code")
    .like("supplier_code", `${prefix}%`)
    .order("supplier_code", { ascending: false })
    .limit(1)

  let sequentialNumber = 1

  if (data && data.length > 0) {
    // Extract the sequential number from the latest code
    const latestCode = data[0].supplier_code
    const match = latestCode.match(/(\d+)$/)

    if (match && match[1]) {
      sequentialNumber = Number.parseInt(match[1], 10) + 1
    }
  }

  // Generate the supplier code in format S-YY-MM-XXXX
  return `${prefix}-${sequentialNumber.toString().padStart(4, "0")}`
}

export async function isSupplierCodeUnique(code: string): Promise<boolean> {
  const { data } = await supabase.from("suppliers").select("id").eq("supplier_code", code).single()

  return !data
}
