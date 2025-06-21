import { NextRequest } from 'next/server'
import { sseService } from '@/lib/server-sent-events'
import { verifyAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // Get user from authentication
    const authResult = await verifyAuth()
    if (!authResult.success || !authResult.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userId = authResult.user.id.toString()
    console.log(`📡 Creating SSE connection for user ${userId}`)

    // Create SSE connection
    return sseService.createConnection(userId)

  } catch (error) {
    console.error('❌ SSE connection error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    // Verify authentication for POST requests
    const authResult = await verifyAuth()
    if (!authResult.success) {
      return new Response('Unauthorized', { status: 401 })
    }

    switch (type) {
      case 'broadcast_notification':
        if (data.userId && data.notification) {
          sseService.sendToUser(data.userId, 'notification', data.notification)
        }
        break
      
      case 'broadcast_activity':
        if (data.activity) {
          sseService.broadcast('activity', data.activity)
        }
        break
      
      case 'broadcast_dashboard':
        if (data.stats) {
          sseService.broadcast('dashboard_update', data.stats)
        }
        break
      
      case 'get_stats':
        const stats = sseService.getStats()
        return Response.json(stats)
      
      default:
        return new Response('Unknown broadcast type', { status: 400 })
    }

    return new Response('Broadcast sent', { status: 200 })

  } catch (error) {
    console.error('❌ SSE API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
} 