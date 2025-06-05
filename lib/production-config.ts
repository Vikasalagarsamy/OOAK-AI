// 🚀 Production Configuration Management
// Centralized configuration for production-grade features

export interface ProductionConfig {
  // Real-time Configuration
  realtime: {
    maxConnections: number
    heartbeatInterval: number
    reconnectAttempts: number
    fallbackPollingInterval: number
    connectionTimeout: number
  }
  
  // Notification System
  notifications: {
    batchingEnabled: boolean
    batchWindow: number
    maxBatchSize: number
    retentionDays: number
    archiveAfterDays: number
  }
  
  // Performance & Caching
  performance: {
    cacheEnabled: boolean
    cacheTTL: number
    maxCacheSize: number
    slowQueryThreshold: number
    enableMetrics: boolean
  }
  
  // Rate Limiting
  rateLimiting: {
    enabled: boolean
    windowSize: number
    maxRequests: {
      read: number
      write: number
      admin: number
    }
  }
  
  // Security
  security: {
    enableRLS: boolean
    requireAuth: boolean
    allowedOrigins: string[]
    maxPayloadSize: number
  }
  
  // Monitoring
  monitoring: {
    enableLogging: boolean
    logLevel: 'debug' | 'info' | 'warn' | 'error'
    enableHealthChecks: boolean
    alertThresholds: {
      errorRate: number
      responseTime: number
      connectionFailures: number
    }
  }
}

// Environment-specific configurations
const configurations: Record<string, ProductionConfig> = {
  development: {
    realtime: {
      maxConnections: 10,
      heartbeatInterval: 30000,
      reconnectAttempts: 3,
      fallbackPollingInterval: 5000,
      connectionTimeout: 10000
    },
    notifications: {
      batchingEnabled: false,
      batchWindow: 60,
      maxBatchSize: 10,
      retentionDays: 30,
      archiveAfterDays: 30
    },
    performance: {
      cacheEnabled: true,
      cacheTTL: 30,
      maxCacheSize: 100,
      slowQueryThreshold: 1000,
      enableMetrics: true
    },
    rateLimiting: {
      enabled: false,
      windowSize: 60,
      maxRequests: {
        read: 100,
        write: 20,
        admin: 50
      }
    },
    security: {
      enableRLS: false,
      requireAuth: false,
      allowedOrigins: ['*'],
      maxPayloadSize: 1048576 // 1MB
    },
    monitoring: {
      enableLogging: true,
      logLevel: 'debug',
      enableHealthChecks: true,
      alertThresholds: {
        errorRate: 10,
        responseTime: 2000,
        connectionFailures: 5
      }
    }
  },
  
  production: {
    realtime: {
      maxConnections: 1000,
      heartbeatInterval: 30000,
      reconnectAttempts: 5,
      fallbackPollingInterval: 10000,
      connectionTimeout: 15000
    },
    notifications: {
      batchingEnabled: true,
      batchWindow: 300, // 5 minutes
      maxBatchSize: 50,
      retentionDays: 90,
      archiveAfterDays: 90
    },
    performance: {
      cacheEnabled: true,
      cacheTTL: 300, // 5 minutes
      maxCacheSize: 10000,
      slowQueryThreshold: 500,
      enableMetrics: true
    },
    rateLimiting: {
      enabled: true,
      windowSize: 60,
      maxRequests: {
        read: 1000,
        write: 100,
        admin: 200
      }
    },
    security: {
      enableRLS: true,
      requireAuth: true,
      allowedOrigins: [
        'https://your-domain.com',
        'https://www.your-domain.com'
      ],
      maxPayloadSize: 524288 // 512KB
    },
    monitoring: {
      enableLogging: true,
      logLevel: 'info',
      enableHealthChecks: true,
      alertThresholds: {
        errorRate: 5,
        responseTime: 1000,
        connectionFailures: 3
      }
    }
  },
  
  staging: {
    realtime: {
      maxConnections: 100,
      heartbeatInterval: 30000,
      reconnectAttempts: 5,
      fallbackPollingInterval: 5000,
      connectionTimeout: 10000
    },
    notifications: {
      batchingEnabled: true,
      batchWindow: 180, // 3 minutes
      maxBatchSize: 20,
      retentionDays: 60,
      archiveAfterDays: 60
    },
    performance: {
      cacheEnabled: true,
      cacheTTL: 120, // 2 minutes
      maxCacheSize: 1000,
      slowQueryThreshold: 800,
      enableMetrics: true
    },
    rateLimiting: {
      enabled: true,
      windowSize: 60,
      maxRequests: {
        read: 500,
        write: 50,
        admin: 100
      }
    },
    security: {
      enableRLS: true,
      requireAuth: true,
      allowedOrigins: [
        'https://staging.your-domain.com'
      ],
      maxPayloadSize: 524288 // 512KB
    },
    monitoring: {
      enableLogging: true,
      logLevel: 'info',
      enableHealthChecks: true,
      alertThresholds: {
        errorRate: 8,
        responseTime: 1500,
        connectionFailures: 4
      }
    }
  }
}

// Get current environment configuration
export function getProductionConfig(): ProductionConfig {
  const env = process.env.NODE_ENV || 'development'
  const config = configurations[env] || configurations.development
  
  // Allow environment variable overrides
  return applyEnvironmentOverrides(config)
}

// Apply environment variable overrides
function applyEnvironmentOverrides(config: ProductionConfig): ProductionConfig {
  const overrides = { ...config }
  
  // Real-time overrides
  if (process.env.REALTIME_MAX_CONNECTIONS) {
    overrides.realtime.maxConnections = parseInt(process.env.REALTIME_MAX_CONNECTIONS)
  }
  
  if (process.env.REALTIME_HEARTBEAT_INTERVAL) {
    overrides.realtime.heartbeatInterval = parseInt(process.env.REALTIME_HEARTBEAT_INTERVAL)
  }
  
  // Notification overrides
  if (process.env.NOTIFICATION_BATCHING_ENABLED) {
    overrides.notifications.batchingEnabled = process.env.NOTIFICATION_BATCHING_ENABLED === 'true'
  }
  
  if (process.env.NOTIFICATION_BATCH_WINDOW) {
    overrides.notifications.batchWindow = parseInt(process.env.NOTIFICATION_BATCH_WINDOW)
  }
  
  // Performance overrides
  if (process.env.CACHE_ENABLED) {
    overrides.performance.cacheEnabled = process.env.CACHE_ENABLED === 'true'
  }
  
  if (process.env.CACHE_TTL) {
    overrides.performance.cacheTTL = parseInt(process.env.CACHE_TTL)
  }
  
  // Rate limiting overrides
  if (process.env.RATE_LIMITING_ENABLED) {
    overrides.rateLimiting.enabled = process.env.RATE_LIMITING_ENABLED === 'true'
  }
  
  if (process.env.RATE_LIMIT_READ) {
    overrides.rateLimiting.maxRequests.read = parseInt(process.env.RATE_LIMIT_READ)
  }
  
  if (process.env.RATE_LIMIT_WRITE) {
    overrides.rateLimiting.maxRequests.write = parseInt(process.env.RATE_LIMIT_WRITE)
  }
  
  // Security overrides
  if (process.env.ENABLE_RLS) {
    overrides.security.enableRLS = process.env.ENABLE_RLS === 'true'
  }
  
  if (process.env.REQUIRE_AUTH) {
    overrides.security.requireAuth = process.env.REQUIRE_AUTH === 'true'
  }
  
  if (process.env.ALLOWED_ORIGINS) {
    overrides.security.allowedOrigins = process.env.ALLOWED_ORIGINS.split(',')
  }
  
  // Monitoring overrides
  if (process.env.LOG_LEVEL) {
    overrides.monitoring.logLevel = process.env.LOG_LEVEL as any
  }
  
  if (process.env.ERROR_RATE_THRESHOLD) {
    overrides.monitoring.alertThresholds.errorRate = parseFloat(process.env.ERROR_RATE_THRESHOLD)
  }
  
  return overrides
}

// Configuration validation
export function validateConfig(config: ProductionConfig): { valid: boolean, errors: string[] } {
  const errors: string[] = []
  
  // Validate realtime configuration
  if (config.realtime.maxConnections <= 0) {
    errors.push('realtime.maxConnections must be positive')
  }
  
  if (config.realtime.heartbeatInterval < 1000) {
    errors.push('realtime.heartbeatInterval must be at least 1000ms')
  }
  
  // Validate notification configuration
  if (config.notifications.batchWindow < 10) {
    errors.push('notifications.batchWindow must be at least 10 seconds')
  }
  
  if (config.notifications.maxBatchSize <= 0) {
    errors.push('notifications.maxBatchSize must be positive')
  }
  
  // Validate performance configuration
  if (config.performance.cacheTTL < 0) {
    errors.push('performance.cacheTTL must be non-negative')
  }
  
  if (config.performance.maxCacheSize <= 0) {
    errors.push('performance.maxCacheSize must be positive')
  }
  
  // Validate rate limiting configuration
  if (config.rateLimiting.windowSize <= 0) {
    errors.push('rateLimiting.windowSize must be positive')
  }
  
  if (config.rateLimiting.maxRequests.read <= 0) {
    errors.push('rateLimiting.maxRequests.read must be positive')
  }
  
  // Validate security configuration
  if (config.security.maxPayloadSize <= 0) {
    errors.push('security.maxPayloadSize must be positive')
  }
  
  // Validate monitoring configuration
  if (!['debug', 'info', 'warn', 'error'].includes(config.monitoring.logLevel)) {
    errors.push('monitoring.logLevel must be one of: debug, info, warn, error')
  }
  
  if (config.monitoring.alertThresholds.errorRate < 0 || config.monitoring.alertThresholds.errorRate > 100) {
    errors.push('monitoring.alertThresholds.errorRate must be between 0 and 100')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Feature flags for gradual rollout
export interface FeatureFlags {
  enhancedNotifications: boolean
  realtimeV2: boolean
  advancedBatching: boolean
  aiInsights: boolean
  performanceMetrics: boolean
}

export function getFeatureFlags(): FeatureFlags {
  return {
    enhancedNotifications: process.env.FEATURE_ENHANCED_NOTIFICATIONS === 'true',
    realtimeV2: process.env.FEATURE_REALTIME_V2 === 'true',
    advancedBatching: process.env.FEATURE_ADVANCED_BATCHING === 'true',
    aiInsights: process.env.FEATURE_AI_INSIGHTS === 'true',
    performanceMetrics: process.env.FEATURE_PERFORMANCE_METRICS === 'true'
  }
}

// Health check configuration
export interface HealthCheckConfig {
  enabled: boolean
  interval: number
  timeout: number
  endpoints: {
    database: boolean
    realtime: boolean
    cache: boolean
    external: boolean
  }
}

export function getHealthCheckConfig(): HealthCheckConfig {
  return {
    enabled: process.env.HEALTH_CHECKS_ENABLED !== 'false',
    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000'),
    endpoints: {
      database: process.env.HEALTH_CHECK_DATABASE !== 'false',
      realtime: process.env.HEALTH_CHECK_REALTIME !== 'false',
      cache: process.env.HEALTH_CHECK_CACHE !== 'false',
      external: process.env.HEALTH_CHECK_EXTERNAL === 'true'
    }
  }
}

// Export the current configuration for easy access
export const PRODUCTION_CONFIG = getProductionConfig()
export const FEATURE_FLAGS = getFeatureFlags()
export const HEALTH_CHECK_CONFIG = getHealthCheckConfig()

// Log configuration on startup (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Production Config Loaded:', {
    environment: process.env.NODE_ENV,
    config: PRODUCTION_CONFIG,
    features: FEATURE_FLAGS,
    health: HEALTH_CHECK_CONFIG
  })
} 