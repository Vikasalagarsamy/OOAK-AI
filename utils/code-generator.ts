import { supabase } from "@/lib/supabase"

/**
 * Generates a unique branch code based on company code and branch name
 * Format: COMPANYCODE + first 3 letters of branch name (uppercase) + optional numeric suffix
 */
export async function generateBranchCode(
  companyCode: string,
  branchName: string,
  currentBranchCode?: string,
): Promise<string> {
  if (!companyCode) {
    throw new Error("Company code is required to generate branch code")
  }

  // Clean company code and branch name
  const cleanCompanyCode = companyCode.trim().toUpperCase()

  // Extract first 3 letters from branch name and convert to uppercase
  const branchPrefix = branchName
    .replace(/[^a-zA-Z0-9]/g, "") // Remove special characters
    .substring(0, 3)
    .toUpperCase()

  // Base branch code
  const baseBranchCode = `${cleanCompanyCode}${branchPrefix}`

  // If this is an update and the code hasn't changed, return the current code
  if (currentBranchCode && currentBranchCode.startsWith(baseBranchCode)) {
    return currentBranchCode
  }

  // Check if the base branch code already exists
  const { data: existingBranch } = await supabase
    .from("branches")
    .select("branch_code")
    .eq("branch_code", baseBranchCode)
    .maybeSingle()

  // If base code is unique, use it
  if (!existingBranch) {
    return baseBranchCode
  }

  // Otherwise, find a unique code by adding a numeric suffix
  let suffix = 1
  let candidateCode = `${baseBranchCode}${suffix}`

  while (true) {
    const { data: existingWithSuffix } = await supabase
      .from("branches")
      .select("branch_code")
      .eq("branch_code", candidateCode)
      .maybeSingle()

    if (!existingWithSuffix) {
      return candidateCode
    }

    suffix++
    candidateCode = `${baseBranchCode}${suffix}`

    // Safety check to prevent infinite loops
    if (suffix > 999) {
      throw new Error("Unable to generate a unique branch code")
    }
  }
}

/**
 * Generates a unique company code.
 * Format: CC + random alphanumeric suffix
 */
export function generateCompanyCode(): string {
  // Generate a random string
  const randomString = Math.random().toString(36).substring(2, 5).toUpperCase()

  return `CC${randomString}`
}
