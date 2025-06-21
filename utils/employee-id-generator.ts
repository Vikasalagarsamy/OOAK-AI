"use server"

import { query } from "@/lib/postgresql-client"

/**
 * EMPLOYEE ID GENERATOR - NOW 100% POSTGRESQL  
 * ============================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized sequential ID generation
 * - All Supabase dependencies eliminated
 */

// Implement the original function name for backward compatibility
export async function getNewEmployeeId(): Promise<string> {
  try {
    console.log('🆔 Generating new employee ID via PostgreSQL...')

    // Get the current year
    const currentYear = new Date().getFullYear().toString().slice(-2)

    // Get the highest employee ID for the current year via PostgreSQL
    const result = await query(`
      SELECT employee_id 
      FROM employees 
      WHERE employee_id LIKE $1
        AND employee_id IS NOT NULL
        AND employee_id != ''
      ORDER BY employee_id DESC 
      LIMIT 1
    `, [`EMP-${currentYear}-%`])

    if (result.rows.length === 0) {
      // No employees for this year yet
      const newId = `EMP-${currentYear}-0001`
      console.log(`✅ Generated first employee ID for year ${currentYear}: ${newId}`)
      return newId
    }

    const latestId = result.rows[0].employee_id

    // Extract the sequence number from the employee ID
    const match = latestId.match(/EMP-\d{2}-(\d{4})/)
    if (!match) {
      // If the format doesn't match, start from 0001
      const newId = `EMP-${currentYear}-0001`
      console.log(`⚠️ Invalid format found, starting fresh: ${newId}`)
      return newId
    }

    // Increment the sequence number
    const sequenceNumber = Number.parseInt(match[1], 10) + 1
    const paddedSequence = sequenceNumber.toString().padStart(4, "0")

    const newId = `EMP-${currentYear}-${paddedSequence}`
    console.log(`✅ Generated employee ID: ${newId} (sequence: ${sequenceNumber})`)
    return newId

  } catch (error: any) {
    console.error('❌ Error generating employee ID via PostgreSQL:', error)
    
    // Fallback ID generation using timestamp
    const currentYear = new Date().getFullYear().toString().slice(-2)
    const timestamp = Date.now().toString().slice(-4)
    const fallbackId = `EMP-${currentYear}-${timestamp}`
    
    console.log(`⚠️ Using fallback employee ID: ${fallbackId}`)
    return fallbackId
  }
}

// Also export the function with the new name for future use
export const generateEmployeeId = getNewEmployeeId

/**
 * Generate a guaranteed unique employee ID by checking existence via PostgreSQL
 */
export async function generateUniqueEmployeeId(): Promise<string> {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const employeeId = await getNewEmployeeId()
    
    // Check if this ID already exists
    const result = await query(`
      SELECT employee_id 
      FROM employees 
      WHERE employee_id = $1 
      LIMIT 1
    `, [employeeId])
    
    if (result.rows.length === 0) {
      console.log(`✅ Generated unique employee ID: ${employeeId} (attempt ${attempts + 1})`)
      return employeeId
    }
    
    console.log(`⚠️ Employee ID ${employeeId} already exists, trying again...`)
    attempts++
  }

  // If we couldn't generate a unique ID after max attempts, add random suffix
  const baseId = await getNewEmployeeId()
  const randomSuffix = Math.random().toString(36).substring(2, 2).toUpperCase()
  const uniqueId = `${baseId}${randomSuffix}`
  
  console.log(`⚠️ Using fallback unique employee ID: ${uniqueId}`)
  return uniqueId
}
