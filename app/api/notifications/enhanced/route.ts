import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'
import { EnhancedNotificationService } from '@/lib/enhanced-notification-service'

// 🚀 Production-Grade PostgreSQL Notification API
// Features: Rate limiting, caching, pagination, filtering, monitoring, connection pooling

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number, resetTime: number }>()

// Cache store (in production, use Redis)
const cacheStore = new Map<string, { data: any, expiry: number }>()

// Performance metrics store
const performanceMetrics = new Map<string, number[]>()

// 📊 GET: Fetch notifications with enhanced PostgreSQL features
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🚀 Production PostgreSQL notification API called')
    
    // 1. Rate limiting check
    const clientId = getClientId(request)
    if (!checkRateLimit(clientId)) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        retryAfter: 60,
        database: 'PostgreSQL localhost:5432'
      }, { status: 429 })
    }
    
    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100), // Max 100
      priority: searchParams.get('priority'),
      type: searchParams.get('type'),
      is_read: searchParams.get('is_read'),
      include_business_only: searchParams.get('business_only') === 'true',
      cache: searchParams.get('cache') !== 'false',
      user_id: searchParams.get('user_id'),
      since: searchParams.get('since'), // For filtering by date
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: searchParams.get('sort_order') || 'DESC'
    }
    
    // 3. Check cache
    const cacheKey = `notifications:${JSON.stringify(params)}`
    if (params.cache) {
      const cached = getFromCache(cacheKey)
      if (cached) {
        console.log('✅ Serving from cache')
        return NextResponse.json({
          ...cached,
          source: 'cache',
          performance: { duration: Date.now() - startTime },
          database: 'PostgreSQL localhost:5432'
        })
      }
    }
    
    // 4. Fetch from PostgreSQL with optimized query
    const result = await fetchNotificationsOptimizedPostgreSQL(params)
    
    // 5. Cache the result
    if (params.cache && result.success) {
      setCache(cacheKey, result, 30) // Cache for 30 seconds
    }
    
    // 6. Log performance metrics
    const duration = Date.now() - startTime
    logPerformanceMetric('api_notification_fetch', duration)
    
    // 7. Return enhanced response
    return NextResponse.json({
      ...result,
      source: 'database',
      database: 'PostgreSQL localhost:5432',
      performance: { 
        duration,
        query_params: params,
        connection_pool: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        }
      },
      cache_info: {
        cached: false,
        cache_key: cacheKey,
        cache_size: cacheStore.size
      }
    })

  } catch (error: any) {
    console.error('❌ Production PostgreSQL notification API error:', error)
    
    const duration = Date.now() - startTime
    logPerformanceMetric('api_notification_error', duration)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown PostgreSQL error',
      details: {
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      performance: { duration },
      database: 'PostgreSQL localhost:5432'
    }, { status: 500 })
  }
}

// 📝 POST: Create notification with enhanced PostgreSQL validation
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('📝 Creating notification via PostgreSQL production API')
    
    // Rate limiting
    const clientId = getClientId(request)
    if (!checkRateLimit(clientId, 10, 60)) { // 10 requests per minute for POST
      return NextResponse.json({
        error: 'Rate limit exceeded for notification creation',
        retryAfter: 60,
        database: 'PostgreSQL localhost:5432'
      }, { status: 429 })
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validationResult = validateNotificationRequest(body)
    
    if (!validationResult.valid) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationResult.errors,
        database: 'PostgreSQL localhost:5432'
      }, { status: 400 })
    }
    
    // Create notification using PostgreSQL with transaction
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      const { rows } = await client.query(`
        INSERT INTO notifications (
          user_id, 
          type, 
          title, 
          message, 
          priority, 
          metadata,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id, created_at
      `, [
        body.user_id,
        body.type,
        body.title,
        body.message,
        body.priority || 'medium',
        JSON.stringify(body.metadata || {})
      ])
      
      await client.query('COMMIT')
      
      // Clear relevant cache entries
      clearNotificationCache()
      
      const duration = Date.now() - startTime
      logPerformanceMetric('api_notification_create', duration)
      
      return NextResponse.json({
        success: true,
        message: 'Notification created successfully via PostgreSQL',
        data: {
          id: rows[0].id,
          created_at: rows[0].created_at
        },
        performance: { duration },
        database: 'PostgreSQL localhost:5432'
      })
      
    } catch (dbError: any) {
      await client.query('ROLLBACK')
      throw dbError
    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ Error creating PostgreSQL notification:', error)
    
    const duration = Date.now() - startTime
    logPerformanceMetric('api_notification_create_error', duration)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown PostgreSQL error',
      details: {
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      performance: { duration },
      database: 'PostgreSQL localhost:5432'
    }, { status: 500 })
  }
}

// 🔧 ENHANCED POSTGRESQL UTILITY FUNCTIONS

function getClientId(request: NextRequest): string {
  // In production, this would be based on user session or API key
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return `client:${ip}`
}

function checkRateLimit(clientId: string, limit = 60, windowSeconds = 60): boolean {
  const now = Date.now()
  const windowStart = now - (windowSeconds * 1000)
  
  const clientData = rateLimitStore.get(clientId)
  
  if (!clientData || clientData.resetTime < now) {
    // Reset or initialize rate limit
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + (windowSeconds * 1000)
    })
    return true
  }
  
  if (clientData.count >= limit) {
    return false
  }
  
  clientData.count++
  return true
}

function getFromCache(key: string): any | null {
  const cached = cacheStore.get(key)
  if (cached && cached.expiry > Date.now()) {
    return cached.data
  }
  
  if (cached) {
    cacheStore.delete(key) // Remove expired cache
  }
  
  return null
}

function setCache(key: string, data: any, ttlSeconds: number): void {
  cacheStore.set(key, {
    data,
    expiry: Date.now() + (ttlSeconds * 1000)
  })
}

function clearNotificationCache(): void {
  for (const [key] of cacheStore) {
    if (key.startsWith('notifications:')) {
      cacheStore.delete(key)
    }
  }
}

function logPerformanceMetric(metric: string, value: number): void {
  if (!performanceMetrics.has(metric)) {
    performanceMetrics.set(metric, [])
  }
  
  const metrics = performanceMetrics.get(metric)!
  metrics.push(value)
  
  // Keep only last 100 measurements
  if (metrics.length > 100) {
    metrics.shift()
  }
  
  // Log slow queries (> 1000ms)
  if (value > 1000) {
    console.warn(`⚠️ Slow ${metric}: ${value}ms`)
  }
}

async function fetchNotificationsOptimizedPostgreSQL(params: any) {
  const client = await pool.connect()
  
  try {
    const queryStart = Date.now()
    
    // Build dynamic WHERE clause
    const conditions = []
    const values = []
    let paramIndex = 1
    
    if (params.priority) {
      conditions.push(`priority = $${paramIndex++}`)
      values.push(params.priority)
    }
    
    if (params.type) {
      conditions.push(`type = $${paramIndex++}`)
      values.push(params.type)
    }
    
    if (params.is_read !== null && params.is_read !== undefined) {
      conditions.push(`is_read = $${paramIndex++}`)
      values.push(params.is_read === 'true')
    }
    
    if (params.user_id) {
      conditions.push(`user_id = $${paramIndex++}`)
      values.push(parseInt(params.user_id))
    }
    
    if (params.since) {
      conditions.push(`created_at >= $${paramIndex++}`)
      values.push(params.since)
    }
    
    if (params.include_business_only) {
      conditions.push(`metadata->>'business_event' = 'true'`)
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    
    // Pagination
    const offset = (params.page - 1) * params.limit
    const sortColumn = ['created_at', 'priority', 'type', 'is_read'].includes(params.sort_by) ? params.sort_by : 'created_at'
    const sortOrder = ['ASC', 'DESC'].includes(params.sort_order.toUpperCase()) ? params.sort_order : 'DESC'
    
    // Main query with enhanced PostgreSQL features
    const { rows: notifications } = await client.query(`
      WITH notification_data AS (
        SELECT 
          id,
          user_id,
          type,
          title,
          message,
          priority,
          is_read,
          created_at,
          updated_at,
          metadata,
          CASE 
            WHEN priority = 'urgent' THEN 4
            WHEN priority = 'high' THEN 3
            WHEN priority = 'medium' THEN 2
            ELSE 1
          END as priority_order,
          EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as hours_ago
        FROM notifications
        ${whereClause}
      ),
      paginated_data AS (
        SELECT *
        FROM notification_data
        ORDER BY 
          CASE WHEN '${sortColumn}' = 'priority' THEN priority_order ELSE NULL END ${sortOrder} NULLS LAST,
          CASE WHEN '${sortColumn}' = 'created_at' THEN created_at ELSE NULL END ${sortOrder} NULLS LAST,
          CASE WHEN '${sortColumn}' = 'type' THEN type ELSE NULL END ${sortOrder} NULLS LAST,
          CASE WHEN '${sortColumn}' = 'is_read' THEN is_read ELSE NULL END ${sortOrder} NULLS LAST
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      )
      SELECT 
        *,
        (SELECT COUNT(*) FROM notification_data) as total_count,
        (SELECT COUNT(*) FROM notifications WHERE is_read = false AND user_id = COALESCE($${params.user_id ? 1 : 'NULL'}, user_id)) as unread_count
      FROM paginated_data
    `, [...values, params.limit, offset])
    
    const queryTime = Date.now() - queryStart
    logPerformanceMetric('postgresql_notification_query', queryTime)
    
    const totalCount = notifications.length > 0 ? parseInt(notifications[0].total_count) : 0
    const unreadCount = notifications.length > 0 ? parseInt(notifications[0].unread_count || 0) : 0
    
    // Clean up the results (remove total_count and unread_count from individual records)
    const cleanNotifications = notifications.map(({ total_count, unread_count, priority_order, hours_ago, ...notification }) => ({
      ...notification,
      hours_ago: parseFloat(hours_ago).toFixed(1)
    }))

    return {
      success: true,
      data: cleanNotifications,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount,
        has_more: (offset + params.limit) < totalCount,
        total_pages: Math.ceil(totalCount / params.limit)
      },
      summary: {
        total_notifications: totalCount,
        unread_count: unreadCount,
        returned: cleanNotifications.length,
        query_performance: `${queryTime}ms`
      },
      filters_applied: {
        priority: params.priority,
        type: params.type,
        is_read: params.is_read,
        user_id: params.user_id,
        business_only: params.include_business_only,
        since: params.since
      }
    }

  } catch (error: any) {
    console.error('❌ PostgreSQL notification query error:', error)
    return {
      success: false,
      error: error.message || 'PostgreSQL database error',
      details: {
        code: error.code,
        detail: error.detail,
        hint: error.hint
      }
    }
  } finally {
    client.release()
  }
}

function validateNotificationRequest(body: any): { valid: boolean, errors?: string[] } {
  const errors: string[] = []
  
  if (!body.user_id || typeof body.user_id !== 'number') {
    errors.push('user_id is required and must be a number')
  }
  
  if (!body.type || typeof body.type !== 'string') {
    errors.push('type is required and must be a string')
  }
  
  if (!body.title || typeof body.title !== 'string') {
    errors.push('title is required and must be a string')
  }
  
  if (!body.message || typeof body.message !== 'string') {
    errors.push('message is required and must be a string')
  }
  
  if (body.priority && !['low', 'medium', 'high', 'urgent'].includes(body.priority)) {
    errors.push('priority must be one of: low, medium, high, urgent')
  }
  
  if (body.metadata && typeof body.metadata !== 'object') {
    errors.push('metadata must be an object')
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

// 📊 Enhanced PostgreSQL health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    const client = await pool.connect()
    
    try {
      // Comprehensive health check
      const { rows } = await client.query(`
        SELECT 
          COUNT(*) as total_notifications,
          COUNT(*) FILTER (WHERE is_read = false) as unread_notifications,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as todays_notifications,
          pg_database_size(current_database()) as db_size,
          version() as pg_version
        FROM notifications
      `)
      
      const healthData = rows[0]
      
      return new NextResponse(null, { 
        status: 200,
        headers: {
          'X-Health-Status': 'healthy',
          'X-Database': 'PostgreSQL localhost:5432',
          'X-Total-Notifications': healthData.total_notifications.toString(),
          'X-Unread-Notifications': healthData.unread_notifications.toString(),
          'X-Cache-Size': cacheStore.size.toString(),
          'X-Rate-Limit-Clients': rateLimitStore.size.toString(),
          'X-Connection-Pool-Total': pool.totalCount.toString(),
          'X-Connection-Pool-Idle': pool.idleCount.toString(),
          'X-Connection-Pool-Waiting': pool.waitingCount.toString(),
          'X-Performance-Metrics': performanceMetrics.size.toString()
        }
      })
      
    } finally {
      client.release()
    }
    
  } catch (error: any) {
    return new NextResponse(null, { 
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy',
        'X-Error': error.message || 'Unknown error'
      }
    })
  }
} 