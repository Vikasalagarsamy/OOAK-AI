import { query } from "@/lib/postgresql-client"

/**
 * CODE GENERATOR - NOW 100% POSTGRESQL
 * ====================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized code generation and uniqueness checks
 * - All Supabase dependencies eliminated
 */

/**
 * Generates a unique branch code based on company code and branch name
 * Format: COMPANYCODE + first 3 letters of branch name (uppercase) + optional numeric suffix
 */
export async function generateBranchCode(
  companyCode: string,
  branchName: string,
  currentBranchCode?: string,
): Promise<string> {
  try {
    console.log(`🏷️ Generating branch code for company: ${companyCode}, branch: ${branchName} via PostgreSQL...`)

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
      console.log(`✅ Using existing branch code: ${currentBranchCode}`)
      return currentBranchCode
    }

    // Check if the base branch code already exists via PostgreSQL
    const existingBranchResult = await query(`
      SELECT branch_code 
      FROM branches 
      WHERE branch_code = $1 
      LIMIT 1
    `, [baseBranchCode])

    // If base code is unique, use it
    if (existingBranchResult.rows.length === 0) {
      console.log(`✅ Generated unique branch code: ${baseBranchCode}`)
      return baseBranchCode
    }

    // Otherwise, find a unique code by adding a numeric suffix
    let suffix = 1
    let candidateCode = `${baseBranchCode}${suffix}`

    while (true) {
      const existingWithSuffixResult = await query(`
        SELECT branch_code 
        FROM branches 
        WHERE branch_code = $1 
        LIMIT 1
      `, [candidateCode])

      if (existingWithSuffixResult.rows.length === 0) {
        console.log(`✅ Generated unique branch code with suffix: ${candidateCode}`)
        return candidateCode
      }

      suffix++
      candidateCode = `${baseBranchCode}${suffix}`

      // Safety check to prevent infinite loops
      if (suffix > 999) {
        const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase()
        const fallbackCode = `${baseBranchCode}${randomSuffix}`
        console.log(`⚠️ Using fallback branch code: ${fallbackCode}`)
        return fallbackCode
      }
    }

  } catch (error: any) {
    console.error(`❌ Error generating branch code for ${companyCode}-${branchName} via PostgreSQL:`, error)
    
    // Generate fallback code
    const timestamp = Date.now().toString().slice(-3)
    const fallbackCode = `${companyCode.trim().toUpperCase()}${timestamp}`
    console.log(`⚠️ Using fallback branch code: ${fallbackCode}`)
    return fallbackCode
  }
}

/**
 * Generates a unique company code.
 * Format: CC + random alphanumeric suffix
 */
export async function generateCompanyCode(): Promise<string> {
  try {
    console.log('🏢 Generating unique company code via PostgreSQL...')

    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      // Generate a random string
      const randomString = Math.random().toString(36).substring(2, 5).toUpperCase()
      const candidateCode = `CC${randomString}`

      // Check if this code already exists via PostgreSQL
      const existingCompanyResult = await query(`
        SELECT company_code 
        FROM companies 
        WHERE company_code = $1 
        LIMIT 1
      `, [candidateCode])

      if (existingCompanyResult.rows.length === 0) {
        console.log(`✅ Generated unique company code: ${candidateCode}`)
        return candidateCode
      }

      attempts++
    }

    // If we couldn't generate a unique code after max attempts, use timestamp
    const timestamp = Date.now().toString().slice(-4)
    const fallbackCode = `CC${timestamp}`
    console.log(`⚠️ Using fallback company code: ${fallbackCode}`)
    return fallbackCode

  } catch (error: any) {
    console.error('❌ Error generating company code via PostgreSQL:', error)
    
    // Generate fallback code
    const timestamp = Date.now().toString().slice(-4)
    const fallbackCode = `CC${timestamp}`
    console.log(`⚠️ Using fallback company code: ${fallbackCode}`)
    return fallbackCode
  }
}

/**
 * Generate a unique department code
 * Format: DEPT + first 3 letters of department name + optional numeric suffix
 */
export async function generateDepartmentCode(departmentName: string): Promise<string> {
  try {
    console.log(`🏢 Generating department code for: ${departmentName} via PostgreSQL...`)

    // Extract first 3 letters from department name
    const deptPrefix = departmentName
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 3)
      .toUpperCase()

    const baseDeptCode = `DEPT${deptPrefix}`

    // Check if the base code already exists
    const existingDeptResult = await query(`
      SELECT code 
      FROM departments 
      WHERE code = $1 
      LIMIT 1
    `, [baseDeptCode])

    if (existingDeptResult.rows.length === 0) {
      console.log(`✅ Generated unique department code: ${baseDeptCode}`)
      return baseDeptCode
    }

    // Add numeric suffix if needed
    let suffix = 1
    let candidateCode = `${baseDeptCode}${suffix}`

    while (suffix <= 99) {
      const existingWithSuffixResult = await query(`
        SELECT code 
        FROM departments 
        WHERE code = $1 
        LIMIT 1
      `, [candidateCode])

      if (existingWithSuffixResult.rows.length === 0) {
        console.log(`✅ Generated unique department code with suffix: ${candidateCode}`)
        return candidateCode
      }

      suffix++
      candidateCode = `${baseDeptCode}${suffix}`
    }

    // Fallback to timestamp if all suffixes are taken
    const timestamp = Date.now().toString().slice(-3)
    const fallbackCode = `DEPT${timestamp}`
    console.log(`⚠️ Using fallback department code: ${fallbackCode}`)
    return fallbackCode

  } catch (error: any) {
    console.error(`❌ Error generating department code for ${departmentName} via PostgreSQL:`, error)
    
    const timestamp = Date.now().toString().slice(-3)
    const fallbackCode = `DEPT${timestamp}`
    console.log(`⚠️ Using fallback department code: ${fallbackCode}`)
    return fallbackCode
  }
}
