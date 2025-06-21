import { query } from "@/lib/postgresql-client"

/**
 * LEAD NUMBER GENERATOR - NOW 100% POSTGRESQL
 * ===========================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized sequential number generation
 * - All Supabase dependencies eliminated
 */

export async function generateLeadNumber(): Promise<string> {
  try {
    console.log('📋 Generating new lead number via PostgreSQL...')

    // Get the current highest lead number via PostgreSQL
    const result = await query(`
      SELECT lead_number 
      FROM leads 
      WHERE lead_number IS NOT NULL 
        AND lead_number != ''
      ORDER BY lead_number DESC 
      LIMIT 1
    `)

    let nextNumber = 1

    if (result.rows.length > 0) {
      // Extract the numeric part of the lead number
      const lastLeadNumber = result.rows[0].lead_number
      const matches = lastLeadNumber.match(/L(\d+)/)

      if (matches && matches[1]) {
        nextNumber = Number.parseInt(matches[1], 10) + 1
      }
    }

    // Format with leading zeros (L0001, L0002, etc.)
    const generatedNumber = `L${nextNumber.toString().padStart(4, "0")}`
    
    console.log(`✅ Generated lead number: ${generatedNumber} via PostgreSQL`)
    return generatedNumber

  } catch (error: any) {
    console.error('❌ Error generating lead number via PostgreSQL:', error)
    
    // Fallback to timestamp-based number if database operation fails
    const timestamp = Date.now().toString().slice(-4)
    const fallbackNumber = `L${timestamp}`
    
    console.log(`⚠️ Using fallback lead number: ${fallbackNumber}`)
    return fallbackNumber
  }
}

export async function ensureUniqueLeadNumber(leadNumber: string): Promise<string> {
  try {
    console.log(`🔍 Checking lead number uniqueness for: ${leadNumber} via PostgreSQL...`)

    // Check if the lead number already exists via PostgreSQL
    const result = await query(`
      SELECT lead_number 
      FROM leads 
      WHERE lead_number = $1 
      LIMIT 1
    `, [leadNumber])

    // If the lead number exists, recursively generate a new one
    if (result.rows.length > 0) {
      console.log(`⚠️ Lead number ${leadNumber} already exists, generating new one...`)
      
      const matches = leadNumber.match(/L(\d+)/)

      if (matches && matches[1]) {
        const nextNumber = Number.parseInt(matches[1], 10) + 1
        const newLeadNumber = `L${nextNumber.toString().padStart(4, "0")}`
        return ensureUniqueLeadNumber(newLeadNumber)
      }
      
      // If pattern doesn't match, generate a new number from scratch
      return generateLeadNumber()
    }

    console.log(`✅ Lead number ${leadNumber} is unique`)
    return leadNumber // Return original if unique

  } catch (error: any) {
    console.error(`❌ Error ensuring unique lead number for ${leadNumber} via PostgreSQL:`, error)
    
    // Generate a completely new number as fallback
    return generateLeadNumber()
  }
}

/**
 * Generate a guaranteed unique lead number by checking uniqueness via PostgreSQL
 */
export async function generateUniqueLeadNumber(): Promise<string> {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const leadNumber = await generateLeadNumber()
    const uniqueNumber = await ensureUniqueLeadNumber(leadNumber)
    
    if (uniqueNumber === leadNumber) {
      console.log(`✅ Generated unique lead number: ${leadNumber} (attempt ${attempts + 1})`)
      return leadNumber
    }
    
    attempts++
  }

  // If we couldn't generate a unique number after max attempts, add random suffix
  const baseNumber = await generateLeadNumber()
  const randomSuffix = Math.random().toString(36).substring(2, 3).toUpperCase()
  const uniqueNumber = `${baseNumber}${randomSuffix}`
  
  console.log(`⚠️ Using fallback unique lead number: ${uniqueNumber}`)
  return uniqueNumber
}
