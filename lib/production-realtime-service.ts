"use client"

import { query } from '@/lib/postgresql-client'
import { EnhancedNotificationService } from './enhanced-notification-service'

interface ConnectionHealth {
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  lastHeartbeat: Date | null
  reconnectAttempts: number
  errorCount: number
}

interface SubscriptionManager {
  channels: Map<string, any>
  health: ConnectionHealth
  callbacks: Map<string, Function[]>
  config: {
    maxReconnectAttempts: number
    reconnectDelay: number
    heartbeatInterval: number
    maxErrorsBeforeFallback: number
  }
}

export class ProductionRealtimeService {
  private static instance: ProductionRealtimeService | null = null
  private subscriptionManager: SubscriptionManager
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private fallbackPollingTimer: NodeJS.Timeout | null = null
  
  private constructor() {
    this.subscriptionManager = {
      channels: new Map(),
      health: {
        status: 'disconnected',
        lastHeartbeat: null,
        reconnectAttempts: 0,
        errorCount: 0
      },
      callbacks: new Map(),
      config: {
        maxReconnectAttempts: 5,
        reconnectDelay: 2000,
        heartbeatInterval: 30000, // 30 seconds
        maxErrorsBeforeFallback: 3
      }
    }
  }

  // 🏭 SINGLETON PATTERN FOR CONNECTION MANAGEMENT
  
  static getInstance(): ProductionRealtimeService {
    if (!this.instance) {
      this.instance = new ProductionRealtimeService()
    }
    return this.instance
  }

  // 🔌 CONNECTION MANAGEMENT
  
  async initializeConnection(): Promise<void> {
    console.log('🔌 Initializing production real-time connection...')
    
    try {
      this.subscriptionManager.health.status = 'connecting'
      
      // Subscribe to notifications with enhanced error handling
      await this.subscribeToNotifications()
      
      // Start health monitoring
      this.startHealthMonitoring()
      
      this.subscriptionManager.health.status = 'connected'
      this.subscriptionManager.health.lastHeartbeat = new Date()
      this.subscriptionManager.health.reconnectAttempts = 0
      this.subscriptionManager.health.errorCount = 0
      
      console.log('✅ Production real-time connection established')
      
    } catch (error) {
      console.error('❌ Failed to initialize real-time connection:', error)
      this.handleConnectionError(error)
    }
  }

  private async subscribeToNotifications(): Promise<void> {
    // Remove existing subscription if any
    if (this.subscriptionManager.channels.has('notifications')) {
      this.subscriptionManager.channels.delete('notifications')
    }
    
    // For PostgreSQL-based real-time, we'll use polling mechanism
    console.log('📡 Setting up PostgreSQL-based notification polling')
    
    // Start immediate polling for notifications
    this.startNotificationPolling()
    
    // Mark as subscribed
    this.subscriptionManager.channels.set('notifications', {
      type: 'polling',
      active: true,
      created: new Date()
    })
  }

  private startNotificationPolling(): void {
    // Poll every 2 seconds for real-time feel
    const pollingInterval = setInterval(async () => {
      try {
        await this.pollForNotifications()
        
        // Update health status
        this.subscriptionManager.health.lastHeartbeat = new Date()
        this.subscriptionManager.health.errorCount = 0
        
      } catch (error) {
        console.error('❌ Polling error:', error)
        this.subscriptionManager.health.errorCount++
        
        if (this.subscriptionManager.health.errorCount >= this.subscriptionManager.config.maxErrorsBeforeFallback) {
          this.fallbackToPolling()
        }
      }
    }, 2000)
    
    // Store interval for cleanup
    this.subscriptionManager.channels.set('polling_interval', pollingInterval)
  }

  private async pollForNotifications(): Promise<void> {
    try {
      // Get latest notifications that haven't been processed
      const data = await query(`
        SELECT * FROM notifications 
        WHERE created_at > NOW() - INTERVAL '30 seconds'
        ORDER BY created_at DESC
        LIMIT 10
      `)
      
      if (data.rows && data.rows.length > 0) {
        // Process each notification
        for (const notification of data.rows) {
          this.handleNotificationChange({
            eventType: 'INSERT',
            new: notification,
            source: 'polling'
          })
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to poll notifications:', error)
      throw error
    }
  }

  // 📡 EVENT HANDLING
  
  private handleNotificationChange(payload: any): void {
    console.log('📡 Real-time notification change:', payload.eventType)
    
    try {
      // Update health status
      this.subscriptionManager.health.lastHeartbeat = new Date()
      this.subscriptionManager.health.errorCount = 0
      
      // Process the change
      this.processNotificationChange(payload)
      
      // Trigger callbacks
      this.triggerCallbacks('notification_change', payload)
      
    } catch (error) {
      console.error('❌ Error handling notification change:', error)
      this.subscriptionManager.health.errorCount++
      
      if (this.subscriptionManager.health.errorCount >= this.subscriptionManager.config.maxErrorsBeforeFallback) {
        this.fallbackToPolling()
      }
    }
  }

  private handleSystemEvent(payload: any): void {
    console.log('🔧 System event:', payload)
    
    if (payload.type === 'system' && payload.event === 'polling_error') {
      this.handleConnectionError(new Error('Polling error received'))
    }
  }

  private async handleSubscriptionStatus(status: string, error?: Error): Promise<void> {
    console.log(`📊 Subscription status: ${status}`)
    
    switch (status) {
      case 'SUBSCRIBED':
        this.subscriptionManager.health.status = 'connected'
        this.subscriptionManager.health.lastHeartbeat = new Date()
        this.subscriptionManager.health.reconnectAttempts = 0
        this.stopFallbackPolling() // Stop polling if we're back online
        break
        
      case 'CHANNEL_ERROR':
      case 'TIMED_OUT':
      case 'CLOSED':
        this.subscriptionManager.health.status = 'error'
        if (error) {
          console.error('❌ Subscription error:', error)
        }
        this.handleConnectionError(error || new Error(`Subscription ${status}`))
        break
    }
    
    this.triggerCallbacks('connection_status', { status, error })
  }

  // 🔄 FALLBACK MECHANISMS
  
  private fallbackToPolling(): void {
    if (this.fallbackPollingTimer) return // Already polling
    
    console.log('🔄 Falling back to extended polling mode due to connection issues')
    
    this.fallbackPollingTimer = setInterval(async () => {
      try {
        console.log('📊 Extended polling for notification updates...')
        await this.pollForUpdates()
      } catch (error) {
        console.error('❌ Extended polling error:', error)
      }
    }, 5000) // Poll every 5 seconds
  }

  private stopFallbackPolling(): void {
    if (this.fallbackPollingTimer) {
      clearInterval(this.fallbackPollingTimer)
      this.fallbackPollingTimer = null
      console.log('✅ Stopped fallback polling - real-time connection restored')
    }
  }

  private async pollForUpdates(): Promise<void> {
    try {
      // Get latest notifications
      const data = await query(`
        SELECT * FROM notifications 
        WHERE is_read = false 
        ORDER BY created_at DESC 
        LIMIT 10
      `)
      
      if (data.rows && data.rows.length > 0) {
        // Trigger update event
        this.triggerCallbacks('notification_change', {
          eventType: 'polling_update',
          new: data.rows,
          source: 'polling'
        })
      }
      
    } catch (error) {
      console.error('❌ Polling failed:', error)
    }
  }

  // 🏥 HEALTH MONITORING
  
  private startHealthMonitoring(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }
    
    this.heartbeatTimer = setInterval(() => {
      this.checkConnectionHealth()
    }, this.subscriptionManager.config.heartbeatInterval)
  }

  private checkConnectionHealth(): void {
    const now = new Date()
    const health = this.subscriptionManager.health
    
    // Check if we've missed heartbeats
    if (health.lastHeartbeat) {
      const timeSinceLastHeartbeat = now.getTime() - health.lastHeartbeat.getTime()
      const maxAllowedGap = this.subscriptionManager.config.heartbeatInterval * 2
      
      if (timeSinceLastHeartbeat > maxAllowedGap) {
        console.warn('⚠️ Heartbeat missed - connection may be unhealthy')
        this.handleConnectionError(new Error('Heartbeat timeout'))
      }
    }
    
    // Log health metrics
    this.logHealthMetrics()
  }

  private logHealthMetrics(): void {
    const health = this.subscriptionManager.health
    
    const metrics = {
      status: health.status,
      last_heartbeat: health.lastHeartbeat?.toISOString(),
      reconnect_attempts: health.reconnectAttempts,
      error_count: health.errorCount,
      active_channels: this.subscriptionManager.channels.size
    }
    
    // Only log in development or when there are issues
    if (process.env.NODE_ENV === 'development' || health.status !== 'connected') {
      console.log('📊 Real-time health:', metrics)
    }
  }

  // 🔧 ERROR HANDLING & RECOVERY
  
  private handleConnectionError(error: Error | unknown): void {
    console.error('❌ Real-time connection error:', error)
    
    this.subscriptionManager.health.status = 'error'
    this.subscriptionManager.health.errorCount++
    
    // Start reconnection attempts
    if (this.subscriptionManager.health.reconnectAttempts < this.subscriptionManager.config.maxReconnectAttempts) {
      this.scheduleReconnection()
    } else {
      console.error('❌ Max reconnection attempts reached - falling back to polling')
      this.fallbackToPolling()
    }
  }

  private scheduleReconnection(): void {
    if (this.reconnectTimer) return // Already scheduled
    
    const delay = this.subscriptionManager.config.reconnectDelay * 
                   Math.pow(2, this.subscriptionManager.health.reconnectAttempts) // Exponential backoff
    
    console.log(`🔄 Scheduling reconnection in ${delay}ms (attempt ${this.subscriptionManager.health.reconnectAttempts + 1})`)
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null
      this.subscriptionManager.health.reconnectAttempts++
      
      try {
        await this.initializeConnection()
      } catch (error) {
        console.error('❌ Reconnection failed:', error)
        this.handleConnectionError(error)
      }
    }, delay)
  }

  // 📞 CALLBACK MANAGEMENT
  
  addCallback(event: string, callback: Function): void {
    if (!this.subscriptionManager.callbacks.has(event)) {
      this.subscriptionManager.callbacks.set(event, [])
    }
    
    this.subscriptionManager.callbacks.get(event)!.push(callback)
  }

  removeCallback(event: string, callback: Function): void {
    const callbacks = this.subscriptionManager.callbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private triggerCallbacks(event: string, data: any): void {
    const callbacks = this.subscriptionManager.callbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`❌ Callback error for event ${event}:`, error)
        }
      })
    }
  }

  // 🎯 BUSINESS LOGIC
  
  private processNotificationChange(payload: any): void {
    // Emit custom events for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('realtimeNotificationUpdate', {
        detail: payload
      }))
      
      // Update localStorage to trigger cross-tab updates
      localStorage.setItem('lastRealtimeUpdate', Date.now().toString())
    }
  }

  // 🧹 CLEANUP
  
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up real-time service...')
    
    // Clear timers
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.stopFallbackPolling()
    
    // Clear polling interval
    const pollingInterval = this.subscriptionManager.channels.get('polling_interval')
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }
    
    this.subscriptionManager.channels.clear()
    this.subscriptionManager.callbacks.clear()
    
    this.subscriptionManager.health.status = 'disconnected'
  }

  // 📊 PUBLIC API
  
  getConnectionHealth(): ConnectionHealth {
    return { ...this.subscriptionManager.health }
  }

  async forceRefresh(): Promise<void> {
    console.log('🔄 Force refreshing real-time connection...')
    await this.cleanup()
    await this.initializeConnection()
  }

  isConnected(): boolean {
    return this.subscriptionManager.health.status === 'connected'
  }
} 