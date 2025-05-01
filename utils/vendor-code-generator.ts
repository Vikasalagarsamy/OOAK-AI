import { supabase } from "@/lib/supabase"

export async function generateVendorCode(): Promise<string> {
  // Get the current date components
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")

  // Base prefix for the code
  const prefix = `V-${year}-${month}-`

  // Find the highest existing sequential number for this month
  const { data } = await supabase
    .from("vendors")
    .select("vendor_code")
    .like("vendor_code", `${prefix}%`)
    .order("vendor_code", { ascending: false })
    .limit(1)

  let sequentialNumber = 1

  // If we found existing codes, extract the highest sequential number and increment it
  if (data && data.length > 0) {
    const lastCode = data[0].vendor_code
    const lastSequentialNumber = Number.parseInt(lastCode.substring(prefix.length), 10)

    if (!isNaN(lastSequentialNumber)) {
      sequentialNumber = lastSequentialNumber + 1
    }
  }

  // Format the sequential number with leading zeros
  const formattedNumber = sequentialNumber.toString().padStart(4, "0")

  // Generate the vendor code in format V-YY-MM-XXXX
  return `${prefix}${formattedNumber}`
}

export async function isVendorCodeUnique(code: string): Promise<boolean> {
  const { data } = await supabase.from("vendors").select("id").eq("vendor_code", code).single()

  return !data
}
