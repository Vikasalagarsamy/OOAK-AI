import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EnhancedNotificationService } from '@/lib/enhanced-notification-service'

// 🚀 Production-Grade Notification API
// Features: Rate limiting, caching, pagination, filtering, monitoring

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number, resetTime: number }>()

// Cache store (in production, use Redis)
const cacheStore = new Map<string, { data: any, expiry: number }>()

// Performance metrics store
const performanceMetrics = new Map<string, number[]>()

// 📊 GET: Fetch notifications with enhanced features
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🚀 Production notification API called')
    
    // 1. Rate limiting check
    const clientId = getClientId(request)
    if (!checkRateLimit(clientId)) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        retryAfter: 60
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
      cache: searchParams.get('cache') !== 'false'
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
          performance: { duration: Date.now() - startTime }
        })
      }
    }
    
    // 4. Fetch from database with optimized query
    const result = await fetchNotificationsOptimized(params)
    
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
      performance: { 
        duration,
        query_params: params
      },
      cache_info: {
        cached: false,
        cache_key: cacheKey
      }
    })

  } catch (error) {
    console.error('❌ Production notification API error:', error)
    
    const duration = Date.now() - startTime
    logPerformanceMetric('api_notification_error', duration)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      performance: { duration }
    }, { status: 500 })
  }
}

// 📝 POST: Create notification with enhanced validation
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('📝 Creating notification via production API')
    
    // Rate limiting
    const clientId = getClientId(request)
    if (!checkRateLimit(clientId, 10, 60)) { // 10 requests per minute for POST
      return NextResponse.json({
        error: 'Rate limit exceeded for notification creation',
        retryAfter: 60
      }, { status: 429 })
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validationResult = validateNotificationRequest(body)
    
    if (!validationResult.valid) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationResult.errors
      }, { status: 400 })
    }
    
    // Create notification using enhanced service
    const success = await EnhancedNotificationService.createNotification(body)
    
    if (!success) {
      throw new Error('Failed to create notification')
    }
    
    // Clear relevant cache entries
    clearNotificationCache()
    
    const duration = Date.now() - startTime
    logPerformanceMetric('api_notification_create', duration)
    
    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      performance: { duration }
    })

  } catch (error) {
    console.error('❌ Error creating notification:', error)
    
    const duration = Date.now() - startTime
    logPerformanceMetric('api_notification_create_error', duration)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      performance: { duration }
    }, { status: 500 })
  }
}

// 🔧 UTILITY FUNCTIONS

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

async function fetchNotificationsOptimized(params: any) {
  const supabase = createClient()
  
  try {
    let query = supabase
      .from('notifications')
      .select(`
        id,
        type,
        title,
        message,
        priority,
        is_read,
        created_at,
        metadata
      `)
    
    // Apply filters
    if (params.priority) {
      query = query.eq('priority', params.priority)
    }
    
    if (params.type) {
      query = query.eq('type', params.type)
    }
    
    if (params.is_read !== null) {
      query = query.eq('is_read', params.is_read === 'true')
    }
    
    if (params.include_business_only) {
      query = query.eq('metadata->business_event', 'true')
    }
    
    // Apply pagination
    const offset = (params.page - 1) * params.limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + params.limit - 1)
    
    const { data: notifications, error, count } = await query
    
    if (error) {
      throw error
    }
    
    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
    
    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
    
    return {
      success: true,
      data: notifications || [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount || 0,
        has_more: (offset + params.limit) < (totalCount || 0)
      },
      summary: {
        total_notifications: totalCount || 0,
        unread_count: unreadCount || 0,
        returned: notifications?.length || 0
      }
    }

  } catch (error) {
    console.error('❌ Database query error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database error'
    }
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
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

// 📊 Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Simple health check
    const { data, error } = await supabase
      .from('notifications')
      .select('count')
      .limit(1)
    
    if (error) {
      return new NextResponse(null, { status: 503 })
    }
    
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'X-Health-Status': 'healthy',
        'X-Cache-Size': cacheStore.size.toString(),
        'X-Rate-Limit-Clients': rateLimitStore.size.toString()
      }
    })
    
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
} 