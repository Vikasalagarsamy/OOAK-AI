import { query } from '@/lib/postgresql-client'

export interface SSEConnection {
  id: string
  userId: string
  response: Response
  controller: ReadableStreamDefaultController
  lastHeartbeat: number
}

class ServerSentEventsService {
  private connections = new Map<string, SSEConnection>()
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start heartbeat to keep connections alive
    this.startHeartbeat()
  }

  // Create SSE connection
  createConnection(userId: string): Response {
    const connectionId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const stream = new ReadableStream({
      start: (controller) => {
        console.log(`📡 SSE connection established for user ${userId}`)
        
        const connection: SSEConnection = {
          id: connectionId,
          userId,
          response: new Response(), // Placeholder
          controller,
          lastHeartbeat: Date.now()
        }

        this.connections.set(connectionId, connection)

        // Send initial connection message
        this.sendToConnection(connectionId, 'connected', { 
          connectionId, 
          timestamp: new Date().toISOString() 
        })

        // Send initial data
        this.sendInitialData(connectionId, userId)
      },
      cancel: () => {
        console.log(`📡 SSE connection closed for user ${userId}`)
        this.connections.delete(connectionId)
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'Access-Control-Allow-Credentials': 'true'
      }
    })
  }

  // Send data to specific connection
  private sendToConnection(connectionId: string, event: string, data: any) {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
      connection.controller.enqueue(new TextEncoder().encode(message))
      connection.lastHeartbeat = Date.now()
    } catch (error) {
      console.error(`❌ Error sending SSE message to ${connectionId}:`, error)
      this.connections.delete(connectionId)
    }
  }

  // Send data to all connections for a user
  sendToUser(userId: string, event: string, data: any) {
    const userConnections = Array.from(this.connections.values())
      .filter(conn => conn.userId === userId)

    userConnections.forEach(connection => {
      this.sendToConnection(connection.id, event, data)
    })

    console.log(`📡 Sent ${event} to ${userConnections.length} connections for user ${userId}`)
  }

  // Broadcast to all connections
  broadcast(event: string, data: any) {
    const connectionCount = this.connections.size
    
    this.connections.forEach((connection, connectionId) => {
      this.sendToConnection(connectionId, event, data)
    })

    console.log(`📡 Broadcasted ${event} to ${connectionCount} connections`)
  }

  // Send initial data when connection is established
  private async sendInitialData(connectionId: string, userId: string) {
    try {
      // Send unread notifications count
      const notificationsResult = await query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      )
      
      const unreadCount = parseInt(notificationsResult.rows[0]?.count || '0')
      this.sendToConnection(connectionId, 'notifications_count', { count: unreadCount })

      // Send recent activities
      const activitiesResult = await query(
        'SELECT * FROM activities ORDER BY created_at DESC LIMIT 5'
      )
      
      this.sendToConnection(connectionId, 'recent_activities', activitiesResult.rows)

      // Send dashboard stats
      const statsResult = await query(`
        SELECT 
          (SELECT COUNT(*) FROM leads) as total_leads,
          (SELECT COUNT(*) FROM clients) as total_clients,
          (SELECT COUNT(*) FROM employees) as total_employees,
          (SELECT COUNT(*) FROM activities WHERE created_at::date = CURRENT_DATE) as today_activities
      `)

      this.sendToConnection(connectionId, 'dashboard_stats', statsResult.rows[0])

    } catch (error) {
      console.error('❌ Error sending initial SSE data:', error)
    }
  }

  // Heartbeat to keep connections alive
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now()
      const staleConnections: string[] = []

      this.connections.forEach((connection, connectionId) => {
        // Remove stale connections (older than 5 minutes)
        if (now - connection.lastHeartbeat > 5 * 60 * 1000) {
          staleConnections.push(connectionId)
        } else {
          // Send heartbeat
          this.sendToConnection(connectionId, 'heartbeat', { timestamp: new Date().toISOString() })
        }
      })

      // Clean up stale connections
      staleConnections.forEach(connectionId => {
        console.log(`🧹 Removing stale SSE connection: ${connectionId}`)
        this.connections.delete(connectionId)
      })

    }, 30000) // Every 30 seconds
  }

  // Get connection stats
  getStats() {
    const userCounts = new Map<string, number>()
    
    this.connections.forEach(connection => {
      const count = userCounts.get(connection.userId) || 0
      userCounts.set(connection.userId, count + 1)
    })

    return {
      totalConnections: this.connections.size,
      uniqueUsers: userCounts.size,
      userBreakdown: Object.fromEntries(userCounts)
    }
  }

  // Clean up on shutdown
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    
    this.connections.forEach((connection, connectionId) => {
      try {
        connection.controller.close()
      } catch (error) {
        console.error(`Error closing SSE connection ${connectionId}:`, error)
      }
    })
    
    this.connections.clear()
  }
}

// Singleton instance
export const sseService = new ServerSentEventsService()

// Utility functions for broadcasting specific events
export const broadcastNotification = (userId: string, notification: any) => {
  sseService.sendToUser(userId, 'notification', notification)
}

export const broadcastActivity = (activity: any) => {
  sseService.broadcast('activity', activity)
}

export const broadcastDashboardUpdate = (stats: any) => {
  sseService.broadcast('dashboard_update', stats)
}

export const broadcastLeadUpdate = (lead: any) => {
  sseService.broadcast('lead_update', lead)
}

export const broadcastClientUpdate = (client: any) => {
  sseService.broadcast('client_update', client)
}

export default sseService 