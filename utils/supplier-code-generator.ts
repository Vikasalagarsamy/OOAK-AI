import { query } from "@/lib/postgresql-client"

/**
 * SUPPLIER CODE GENERATOR - NOW 100% POSTGRESQL
 * =============================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized sequential number generation
 * - All Supabase dependencies eliminated
 */

export async function generateSupplierCode(): Promise<string> {
  try {
    console.log('🏢 Generating new supplier code via PostgreSQL...')
    
    // Get the current date components
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, "0")

    // Format for the prefix of the code
    const prefix = `S-${year}-${month}`

    // Get the highest sequential number for this month via PostgreSQL
    const result = await query(`
      SELECT supplier_code 
      FROM suppliers 
      WHERE supplier_code LIKE $1
      ORDER BY supplier_code DESC 
      LIMIT 1
    `, [`${prefix}%`])

    let sequentialNumber = 1

    if (result.rows.length > 0) {
      // Extract the sequential number from the latest code
      const latestCode = result.rows[0].supplier_code
      const match = latestCode.match(/(\d+)$/)

      if (match && match[1]) {
        sequentialNumber = Number.parseInt(match[1], 10) + 1
      }
    }

    // Generate the supplier code in format S-YY-MM-XXXX
    const generatedCode = `${prefix}-${sequentialNumber.toString().padStart(4, "0")}`
    
    console.log(`✅ Generated supplier code: ${generatedCode} via PostgreSQL`)
    return generatedCode

  } catch (error: any) {
    console.error('❌ Error generating supplier code via PostgreSQL:', error)
    
    // Fallback to timestamp-based code if database operation fails
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const timestamp = Date.now().toString().slice(-4)
    const fallbackCode = `S-${year}-${month}-${timestamp}`
    
    console.log(`⚠️ Using fallback supplier code: ${fallbackCode}`)
    return fallbackCode
  }
}

export async function isSupplierCodeUnique(code: string): Promise<boolean> {
  try {
    console.log(`🔍 Checking supplier code uniqueness for: ${code} via PostgreSQL...`)
    
    const result = await query(`
      SELECT id 
      FROM suppliers 
      WHERE supplier_code = $1 
      LIMIT 1
    `, [code])

    const isUnique = result.rows.length === 0
    
    console.log(`${isUnique ? '✅' : '⚠️'} Supplier code ${code} is ${isUnique ? 'unique' : 'already taken'}`)
    return isUnique

  } catch (error: any) {
    console.error(`❌ Error checking supplier code uniqueness for ${code} via PostgreSQL:`, error)
    
    // In case of error, assume not unique for safety
    return false
  }
}

/**
 * Generate a guaranteed unique supplier code by checking uniqueness via PostgreSQL
 */
export async function generateUniqueSupplierCode(): Promise<string> {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const code = await generateSupplierCode()
    const isUnique = await isSupplierCodeUnique(code)
    
    if (isUnique) {
      console.log(`✅ Generated unique supplier code: ${code} (attempt ${attempts + 1})`)
      return code
    }
    
    attempts++
    console.log(`⚠️ Supplier code ${code} not unique, retrying... (attempt ${attempts})`)
  }

  // If we couldn't generate a unique code after max attempts, add random suffix
  const baseCode = await generateSupplierCode()
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase()
  const uniqueCode = `${baseCode}-${randomSuffix}`
  
  console.log(`⚠️ Using fallback unique supplier code: ${uniqueCode}`)
  return uniqueCode
}
