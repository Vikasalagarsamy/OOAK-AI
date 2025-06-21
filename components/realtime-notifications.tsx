'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, RefreshCw, Database, Wifi, WifiOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCurrentUser } from "@/hooks/use-current-user"

import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  is_read: boolean
  user_id: number
  metadata?: any
}

export function RealtimeNotifications() {
  const { user } = useCurrentUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string>('CONNECTING')
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  // Refs to track polling and prevent duplicates
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)
  const lastNotificationId = useRef<string | null>(null)

  // Cleanup function
  const cleanup = () => {
    console.log('🧹 Cleaning up notifications component')
    
    // Clear polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    // Reset polling state
    isPollingRef.current = false
    setConnectionStatus('DISCONNECTED')
  }

  // Load notifications function with PostgreSQL
  const loadNotifications = async (showRefreshing = false) => {
    if (isPollingRef.current) {
      console.log('⚠️ Polling already in progress, skipping...')
      return
    }

    if (!user) {
      console.log('🚪 User not authenticated, skipping notification load')
      setNotifications([])
      setUnreadCount(0)
      setConnectionStatus('DISCONNECTED')
      return
    }

    isPollingRef.current = true
    
    try {
      if (showRefreshing) setIsRefreshing(true)
      
      console.log('🔔 Loading notifications from PostgreSQL for user:', user.id)
      
      // PostgreSQL query to fetch notifications
      const result = await query(`
        SELECT 
          id,
          type,
          title,
          message,
          priority,
          created_at,
          is_read,
          user_id,
          metadata
        FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 100
      `, [user.id])
      
      const notificationsList = result.rows as Notification[]
      console.log('📊 Notifications loaded from PostgreSQL:', notificationsList.length)
      
      // Check for new notifications
      if (notificationsList.length > 0 && lastNotificationId.current) {
        const newNotifications = notificationsList.filter(n => 
          new Date(n.created_at) > new Date(lastNotificationId.current || '1970-01-01')
        )
        
        if (newNotifications.length > 0) {
          console.log('🆕 Found', newNotifications.length, 'new notifications')
          // Could trigger browser notification here if needed
        }
      }
      
      setNotifications(notificationsList)
      
      // Update last notification timestamp
      if (notificationsList.length > 0) {
        lastNotificationId.current = notificationsList[0].created_at
      }
      
      const unread = notificationsList.filter((n: Notification) => !n.is_read).length
      setUnreadCount(unread)
      setLastUpdate(new Date())
      setConnectionStatus('CONNECTED')
      setError(null)
      
      console.log('📈 Unread count updated to:', unread)
      
    } catch (error: any) {
      console.error('❌ Error loading notifications from PostgreSQL:', error)
      setError(error.message || 'Failed to load notifications')
      setConnectionStatus('ERROR')
    } finally {
      setIsLoading(false)
      if (showRefreshing) setIsRefreshing(false)
      isPollingRef.current = false
    }
  }

  // Setup PostgreSQL polling for real-time updates
  const setupPolling = () => {
    if (!user) {
      console.log('👤 No user found, skipping polling setup')
      return
    }

    // Clear any existing polling
    cleanup()

    console.log('🔄 Setting up PostgreSQL polling for user:', user.id)
    
    // Initial load
    loadNotifications()
    
    // Set up polling every 10 seconds for real-time updates
    pollIntervalRef.current = setInterval(() => {
      if (user) {
        loadNotifications()
      } else {
        cleanup()
      }
    }, 10000) as NodeJS.Timeout // 10 second polling interval
    
    setConnectionStatus('POLLING')
  }

  // Initialize notifications when user changes
  useEffect(() => {
    if (user) {
      console.log('👤 User authenticated, setting up notifications:', user.username || user.id)
      setupPolling()
    } else {
      console.log('👤 User not authenticated, cleaning up notifications')
      cleanup()
      setNotifications([])
      setUnreadCount(0)
    }

    // Cleanup on unmount or user change
    return cleanup
  }, [user])

  const refreshNotifications = () => {
    console.log('🔄 Manual refresh requested')
    loadNotifications(true)
  }

  const markAsRead = async (notificationId: string) => {
    if (!user) {
      console.log('👤 User not authenticated, cannot mark notification as read')
      return
    }

    try {
      console.log('📖 Marking notification as read:', notificationId)
      
      // Update notification in PostgreSQL
      await query(`
        UPDATE notifications 
        SET is_read = true, 
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
      `, [notificationId, user.id])

      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true }
          : notification
      ))

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
      
      console.log('✅ Notification marked as read successfully')
      
    } catch (error: any) {
      console.error('❌ Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) {
      console.log('👤 User not authenticated, cannot mark all notifications as read')
      return
    }

    try {
      console.log('📖 Marking all notifications as read for user:', user.id)
      
      // Update all notifications in PostgreSQL
      await query(`
        UPDATE notifications 
        SET is_read = true, 
            updated_at = NOW()
        WHERE user_id = $1 AND is_read = false
      `, [user.id])

      // Update local state
      setNotifications(prev => prev.map(notification => 
        ({ ...notification, is_read: true })
      ))

      setUnreadCount(0)
      
      console.log('✅ All notifications marked as read successfully')
      
    } catch (error: any) {
      console.error('❌ Error marking all notifications as read:', error)
    }
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'CONNECTED':
      case 'POLLING':
        return <Wifi className="h-3 w-3 text-green-500" />
      case 'ERROR':
        return <WifiOff className="h-3 w-3 text-red-500" />
      case 'CONNECTING':
        return <RefreshCw className="h-3 w-3 animate-spin text-yellow-500" />
      default:
        return <WifiOff className="h-3 w-3 text-gray-500" />
    }
  }

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'CONNECTED':
      case 'POLLING':
        return 'Connected'
      case 'ERROR':
        return 'Error'
      case 'CONNECTING':
        return 'Connecting'
      default:
        return 'Disconnected'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            <Badge variant="outline" className="flex items-center gap-1">
              {getConnectionIcon()}
              PostgreSQL
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshNotifications}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Status */}
        <div className="px-4 py-2 border-b bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              {getConnectionIcon()}
              {getConnectionStatus()}
              {lastUpdate && (
                <span>• Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}</span>
              )}
            </span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-6 px-2 text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-64 overflow-y-auto">
          {error ? (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertDescription className="text-sm">
                  {error}
                </AlertDescription>
              </Alert>
              <Button 
                onClick={refreshNotifications} 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </Button>
            </div>
          ) : !user ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Please log in to view notifications
            </div>
          ) : isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Database className="h-4 w-4 mx-auto mb-2 animate-pulse" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-xs mt-1">You'll see new notifications here</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        <Badge 
                          variant={
                            notification.priority === 'urgent' ? 'destructive' :
                            notification.priority === 'high' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {notification.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t bg-muted/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {notifications.length} notifications</span>
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                Real-time polling
              </span>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 