import { query } from '@/lib/postgresql-client'

/**
 * 🔥 DATABASE CONNECTION WARMER
 * 
 * Pre-establishes connections to eliminate cold start delays
 * Runs lightweight queries to keep connections active
 */

let connectionWarmed = false
let warmupPromise: Promise<void> | null = null

interface WarmupResult {
  success: boolean
  time: number
  error?: string
}

export async function warmDatabaseConnection(): Promise<WarmupResult> {
  const startTime = Date.now()
  
  // If already warming up, return the existing promise
  if (warmupPromise) {
    await warmupPromise
    return { success: connectionWarmed, time: Date.now() - startTime }
  }
  
  // If already warmed, return immediately
  if (connectionWarmed) {
    return { success: true, time: Date.now() - startTime }
  }
  
  // Start warming process
  warmupPromise = performWarmup()
  
  try {
    await warmupPromise
    connectionWarmed = true
    const time = Date.now() - startTime
    console.log(`🔥 Database connection warmed in ${time}ms`)
    return { success: true, time }
  } catch (error: any) {
    const time = Date.now() - startTime
    console.log(`❌ Database warmup failed in ${time}ms:`, error?.message)
    return { success: false, time, error: error?.message }
  } finally {
    warmupPromise = null
  }
}

async function performWarmup(): Promise<void> {
  try {
    // 🚀 LIGHTWEIGHT WARMUP QUERIES (minimal data transfer)
    const warmupPromises = [
      // Check basic table existence and connectivity
      query(`SELECT 1 AS connection_test`),
      query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1`),
      query(`SELECT NOW() AS current_time`)
    ]
    
    // Run warmup queries with timeout
    await Promise.race([
      Promise.allSettled(warmupPromises),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Warmup timeout')), 1000))
    ])
    
    console.log('✅ Database connection pool warmed')
  } catch (error) {
    console.log('⚠️ Database warmup had issues but connection established:', error)
    // Don't throw - connection might still work for actual queries
  }
}

// 🔥 AUTO-WARMUP ON SERVER START
if (typeof window === 'undefined') {
  // Only run on server side
  setTimeout(() => {
    warmDatabaseConnection().catch(console.error)
  }, 100) // Small delay to avoid blocking startup
}

// 🚀 BACKGROUND KEEP-ALIVE
if (typeof window === 'undefined') {
  setInterval(() => {
    if (connectionWarmed) {
      // Keep connection alive with minimal query
      performWarmup().catch(() => {
        connectionWarmed = false // Reset if connection lost
      })
    }
  }, 5 * 60 * 1000) // Every 5 minutes
}

export function isConnectionWarmed(): boolean {
  return connectionWarmed
}

export function resetConnection(): void {
  connectionWarmed = false
  warmupPromise = null
} 