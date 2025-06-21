/**
 * ⚡ ULTRA-FAST CACHE SYSTEM
 * 
 * Eliminates redundant API calls and database queries
 * Expected Impact: 4500ms → <50ms page loads
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface DashboardData {
  stats: {
    employees: number
    departments: number
    quotations: number
    roles: number
  }
  recentLeads: any[]
  roles: any[]
}

class UltraFastCache {
  private cache = new Map<string, CacheEntry<any>>()
  
  // Cache TTLs optimized for wedding photography business
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly USER_TTL = 10 * 60 * 1000    // 10 minutes  
  private readonly DASHBOARD_TTL = 2 * 60 * 1000 // 2 minutes (frequently updated)
  private readonly LEADS_TTL = 1 * 60 * 1000     // 1 minute (real-time important)

  /**
   * 🔥 GET DATA WITH INTELLIGENT CACHING
   */
  async get<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = this.cache.get(key)
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`🚀 Cache HIT: ${key} (${Date.now() - cached.timestamp}ms old)`)
      return cached.data
    }
    
    // Fetch fresh data
    console.log(`🔄 Cache MISS: ${key} - fetching fresh data`)
    const startTime = Date.now()
    
    try {
      const data = await fetcher()
      
      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      })
      
      const fetchTime = Date.now() - startTime
      console.log(`✅ Cached: ${key} (fetched in ${fetchTime}ms)`)
      
      return data
    } catch (error) {
      console.error(`❌ Cache fetch failed: ${key}`, error)
      throw error
    }
  }

  /**
   * 🚀 BATCH DASHBOARD DATA (Multiple queries → Single cached result)
   */
  async getDashboardData(): Promise<DashboardData> {
    return this.get(
      'dashboard-batch',
      async () => {
        const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000'
        const response = await fetch(`${baseUrl}/api/dashboard/batch`)
        if (!response.ok) {
          throw new Error(`Dashboard batch failed: ${response.status}`)
        }
        const result = await response.json()
        return result.data
      },
      this.DASHBOARD_TTL
    )
  }

  /**
   * 🔥 USER DATA CACHING (Eliminate repeated getCurrentUser calls)
   */
  async getUserData(userId: string) {
    return this.get(
      `user-${userId}`,
      async () => {
        const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000'
        const response = await fetch(`${baseUrl}/api/auth/status`)
        if (!response.ok) throw new Error('User fetch failed')
        return response.json()
      },
      this.USER_TTL
    )
  }

  /**
   * 🚀 LEADS DATA CACHING
   */
  async getMyLeads(employeeId: string) {
    return this.get(
      `my-leads-${employeeId}`,
      async () => {
        const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000'
        const response = await fetch(`${baseUrl}/api/leads/my-leads`)
        if (!response.ok) throw new Error('Leads fetch failed')
        return response.json()
      },
      this.LEADS_TTL
    )
  }

  /**
   * 🔥 SMART CACHE INVALIDATION
   */
  invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys())
    const matchingKeys = keys.filter(key => key.includes(pattern))
    
    matchingKeys.forEach(key => {
      this.cache.delete(key)
      console.log(`🗑️ Invalidated cache: ${key}`)
    })
  }

  /**
   * 🚀 PRELOAD CRITICAL DATA (Wedding photography essentials)
   */
  async preloadCriticalData(userId: string): Promise<void> {
    if (typeof window === 'undefined') return // Skip on server
    
    console.log('🚀 Preloading critical data for wedding photography business...')
    
    try {
      // Preload in parallel for maximum speed
      await Promise.all([
        this.getDashboardData(),
        this.getUserData(userId),
        // Preload recent leads (most important for wedding business)
        this.get('recent-leads', async () => {
          const response = await fetch('/api/leads/my-leads?limit=10')
          if (!response.ok) throw new Error('Recent leads fetch failed')
          return response.json()
        }, this.LEADS_TTL)
      ])
      
      console.log('✅ Critical data preloaded!')
    } catch (error) {
      console.error('❌ Preload failed:', error)
    }
  }

  /**
   * 🔥 CACHE STATISTICS
   */
  getStats() {
    const entries = Array.from(this.cache.entries())
    const fresh = entries.filter(([_, entry]) => Date.now() - entry.timestamp < entry.ttl)
    const stale = entries.length - fresh.length
    
    return {
      total: entries.length,
      fresh: fresh.length,
      stale,
      hitRate: fresh.length / entries.length || 0
    }
  }

  /**
   * 🚀 CLEAR CACHE (For testing)
   */
  clear(): void {
    this.cache.clear()
    console.log('🧹 Cache cleared')
  }
}

// 🔥 SINGLETON INSTANCE
export const ultraCache = new UltraFastCache()

// 🚀 CACHE WARMING UTILITY
export async function warmCache(userId: string): Promise<void> {
  await ultraCache.preloadCriticalData(userId)
}

// 🔥 SMART CACHE HOOKS FOR REACT COMPONENTS
export function useCachedData<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttl?: number
) {
  return ultraCache.get(key, fetcher, ttl)
} 