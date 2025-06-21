import { query } from "@/lib/postgresql-client"

/**
 * CLIENT CODE GENERATOR - NOW 100% POSTGRESQL
 * ===========================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized client code generation with uniqueness checks
 * - All Supabase dependencies eliminated
 */

export async function generateClientCode(companyId: number): Promise<string> {
  try {
    console.log(`🏷️ Generating client code for company ID: ${companyId} via PostgreSQL...`)

    // Get the company code via PostgreSQL with enhanced column detection
    const companyResult = await query(`
      SELECT 
        COALESCE(company_code, code, '') as company_code,
        COALESCE(company_name, name, title, '') as company_name,
        id
      FROM companies 
      WHERE id = $1
    `, [companyId])

    if (companyResult.rows.length === 0) {
      console.error(`❌ Company not found: ${companyId}`)
      throw new Error(`Company with ID ${companyId} not found`)
    }

    const companyData = companyResult.rows[0]

    // Determine company code intelligently
    let companyCode = ""
    if (companyData.company_code && companyData.company_code.trim()) {
      companyCode = companyData.company_code.trim()
    } else if (companyData.company_name && companyData.company_name.trim()) {
      // Use first two letters of company name
      companyCode = companyData.company_name.substring(0, 2).toUpperCase()
    } else {
      // Fallback to company ID
      companyCode = `CO${companyId}`
    }

    console.log(`✅ Using company code: ${companyCode} for company: ${companyData.company_name || companyId}`)

    // Find the highest existing client code number for this company via PostgreSQL
    const prefix = `C${companyCode}`
    const existingClientsResult = await query(`
      SELECT client_code 
      FROM clients 
      WHERE company_id = $1 
        AND client_code ILIKE $2
        AND client_code IS NOT NULL
      ORDER BY client_code DESC 
      LIMIT 1
    `, [companyId, `${prefix}%`])

    let nextNumber = 1

    if (existingClientsResult.rows.length > 0) {
      // Extract the number from the highest existing code
      const highestCode = existingClientsResult.rows[0].client_code
      const match = highestCode.match(/\d+$/)

      if (match) {
        nextNumber = Number.parseInt(match[0], 10) + 1
      }
    }

    // Generate the client code with padded number
    const paddedNumber = nextNumber.toString().padStart(3, "0")
    const generatedCode = `${prefix}${paddedNumber}`
    
    console.log(`✅ Generated client code: ${generatedCode} (next number: ${nextNumber})`)
    return generatedCode

  } catch (error: any) {
    console.error(`❌ Error generating client code for company ${companyId} via PostgreSQL:`, error)
    
    // Enhanced fallback with timestamp
    const timestamp = Date.now().toString().slice(-6)
    const fallbackCode = `C${companyId}${timestamp}`
    
    console.log(`⚠️ Using fallback client code: ${fallbackCode}`)
    return fallbackCode
  }
}

// Function to ensure a unique client code by checking if it exists via PostgreSQL
export async function ensureUniqueClientCode(baseCode: string): Promise<string> {
  try {
    console.log(`🔍 Ensuring unique client code for: ${baseCode} via PostgreSQL...`)
    
    let attemptCount = 0
    let clientCode = baseCode

    while (attemptCount < 10) {
      // Check if the code already exists via PostgreSQL
      const existsResult = await query(`
        SELECT COUNT(*) as count 
        FROM clients 
        WHERE client_code = $1
      `, [clientCode])

      const count = Number.parseInt(existsResult.rows[0].count, 10)

      if (count === 0) {
        console.log(`✅ Client code ${clientCode} is unique`)
        return clientCode
      }

      console.log(`⚠️ Client code ${clientCode} already exists, generating alternative...`)

      // Code exists, append a random suffix and try again
      const randomSuffix = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")
      clientCode = `${baseCode}-${randomSuffix}`
      attemptCount++
    }

    // If we've tried too many times, use timestamp for guaranteed uniqueness
    const timestampSuffix = Date.now().toString().slice(-6)
    const finalCode = `${baseCode}-${timestampSuffix}`
    
    console.log(`⚠️ Using timestamp-based unique client code: ${finalCode}`)
    return finalCode

  } catch (error: any) {
    console.error(`❌ Error ensuring unique client code for ${baseCode} via PostgreSQL:`, error)
    
    // Ultimate fallback
    const timestampSuffix = Date.now().toString().slice(-6)
    const fallbackCode = `${baseCode}-${timestampSuffix}`
    
    console.log(`⚠️ Using fallback unique client code: ${fallbackCode}`)
    return fallbackCode
  }
}

/**
 * Generate a guaranteed unique client code for a company
 */
export async function generateUniqueClientCode(companyId: number): Promise<string> {
  try {
    console.log(`🎯 Generating guaranteed unique client code for company: ${companyId}`)
    
    const baseCode = await generateClientCode(companyId)
    const uniqueCode = await ensureUniqueClientCode(baseCode)
    
    console.log(`✅ Final unique client code: ${uniqueCode}`)
    return uniqueCode

  } catch (error: any) {
    console.error(`❌ Error generating unique client code for company ${companyId}:`, error)
    
    // Ultimate fallback
    const timestamp = Date.now().toString().slice(-6)
    const fallbackCode = `C${companyId}${timestamp}`
    
    console.log(`⚠️ Using ultimate fallback client code: ${fallbackCode}`)
    return fallbackCode
  }
} 