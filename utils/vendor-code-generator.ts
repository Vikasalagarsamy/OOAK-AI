import { query } from "@/lib/postgresql-client"

/**
 * VENDOR CODE GENERATOR - NOW 100% POSTGRESQL
 * ===========================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized sequential number generation
 * - All Supabase dependencies eliminated
 */

export async function generateVendorCode(): Promise<string> {
  try {
    console.log('🏭 Generating new vendor code via PostgreSQL...')
    
    // Get the current date components
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, "0")

    // Base prefix for the code
    const prefix = `V-${year}-${month}-`

    // Find the highest existing sequential number for this month via PostgreSQL
    const result = await query(`
      SELECT vendor_code 
      FROM vendors 
      WHERE vendor_code LIKE $1
      ORDER BY vendor_code DESC 
      LIMIT 1
    `, [`${prefix}%`])

    let sequentialNumber = 1

    // If we found existing codes, extract the highest sequential number and increment it
    if (result.rows.length > 0) {
      const lastCode = result.rows[0].vendor_code
      const lastSequentialNumber = Number.parseInt(lastCode.substring(prefix.length), 10)

      if (!isNaN(lastSequentialNumber)) {
        sequentialNumber = lastSequentialNumber + 1
      }
    }

    // Format the sequential number with leading zeros
    const formattedNumber = sequentialNumber.toString().padStart(4, "0")

    // Generate the vendor code in format V-YY-MM-XXXX
    const generatedCode = `${prefix}${formattedNumber}`
    
    console.log(`✅ Generated vendor code: ${generatedCode} via PostgreSQL`)
    return generatedCode

  } catch (error: any) {
    console.error('❌ Error generating vendor code via PostgreSQL:', error)
    
    // Fallback to timestamp-based code if database operation fails
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const timestamp = Date.now().toString().slice(-4)
    const fallbackCode = `V-${year}-${month}-${timestamp}`
    
    console.log(`⚠️ Using fallback vendor code: ${fallbackCode}`)
    return fallbackCode
  }
}

export async function isVendorCodeUnique(code: string): Promise<boolean> {
  try {
    console.log(`🔍 Checking vendor code uniqueness for: ${code} via PostgreSQL...`)
    
    const result = await query(`
      SELECT id 
      FROM vendors 
      WHERE vendor_code = $1 
      LIMIT 1
    `, [code])

    const isUnique = result.rows.length === 0
    
    console.log(`${isUnique ? '✅' : '⚠️'} Vendor code ${code} is ${isUnique ? 'unique' : 'already taken'}`)
    return isUnique

  } catch (error: any) {
    console.error(`❌ Error checking vendor code uniqueness for ${code} via PostgreSQL:`, error)
    
    // In case of error, assume not unique for safety
    return false
  }
}

/**
 * Generate a guaranteed unique vendor code by checking uniqueness via PostgreSQL
 */
export async function generateUniqueVendorCode(): Promise<string> {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const code = await generateVendorCode()
    const isUnique = await isVendorCodeUnique(code)
    
    if (isUnique) {
      console.log(`✅ Generated unique vendor code: ${code} (attempt ${attempts + 1})`)
      return code
    }
    
    attempts++
    console.log(`⚠️ Vendor code ${code} not unique, retrying... (attempt ${attempts})`)
  }

  // If we couldn't generate a unique code after max attempts, add random suffix
  const baseCode = await generateVendorCode()
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase()
  const uniqueCode = `${baseCode}-${randomSuffix}`
  
  console.log(`⚠️ Using fallback unique vendor code: ${uniqueCode}`)
  return uniqueCode
}
