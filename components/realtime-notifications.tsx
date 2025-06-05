'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, RefreshCw } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { createClient } from '@/lib/supabase-browser'
import { formatDistanceToNow } from 'date-fns'
import { getCurrentUser } from '@/actions/auth-actions'

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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string>('CONNECTING')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Refs to track subscriptions and prevent duplicates
  const channelRef = useRef<any>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isSubscribedRef = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)

  // Check authentication status
  const checkAuthentication = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        setCurrentUser(user)
        setIsAuthenticated(true)
        return user
      } else {
        setCurrentUser(null)
        setIsAuthenticated(false)
        return null
      }
    } catch (error) {
      console.log('🚪 User not authenticated')
      setCurrentUser(null)
      setIsAuthenticated(false)
      return null
    }
  }

  // Cleanup function
  const cleanup = () => {
    console.log('🧹 Cleaning up notifications component')
    
    // Clear polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    // Remove channel subscription
    if (channelRef.current) {
      try {
        const supabase = createClient()
        supabase.removeChannel(channelRef.current)
        console.log('✅ Channel removed successfully')
      } catch (error) {
        console.log('⚠️ Error removing channel:', error)
      }
      channelRef.current = null
    }

    // Reset subscription state
    isSubscribedRef.current = false
    setConnectionStatus('DISCONNECTED')
  }

  // Load notifications function with authentication check
  const loadNotifications = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true)
      
      // Check authentication first
      const user = await checkAuthentication()
      if (!user || !isAuthenticated) {
        console.log('🚪 User not authenticated, skipping notification load')
        setNotifications([])
        setUnreadCount(0)
        return
      }
      
      console.log('🔔 Loading notifications for user:', user.id)
      const response = await fetch(`/api/notifications?user_id=${user.id}&limit=100&_t=` + Date.now())
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Notifications loaded:', data.notifications?.length || 0)
        
        const notificationsList = data.notifications || []
        setNotifications(notificationsList)
        
        const unread = notificationsList.filter((n: Notification) => !n.is_read).length
        setUnreadCount(unread)
        console.log('📈 Unread count updated to:', unread)
      } else if (response.status === 401) {
        console.log('🚪 Authentication failed (401), user likely logged out')
        setIsAuthenticated(false)
        setNotifications([])
        setUnreadCount(0)
        cleanup()
        return
      } else {
        console.error('❌ Failed to load notifications:', response.status)
      }
    } catch (error: any) {
      // Only log errors if we're still authenticated
      if (isAuthenticated && !error.message?.includes('401')) {
        console.error('❌ Error loading notifications:', error)
      }
    } finally {
      setIsLoading(false)
      if (showRefreshing) setIsRefreshing(false)
    }
  }

  // Setup realtime subscription
  const setupRealtimeSubscription = async (user: any) => {
    // Prevent multiple subscriptions
    if (isSubscribedRef.current || channelRef.current) {
      console.log('⚠️ Subscription already exists, skipping setup')
      return
    }

    try {
      const supabase = createClient()
      console.log('🔗 Setting up real-time subscription for user:', user.id)
      
      // Create unique channel name for this user session
      const channelName = `notifications-${user.id}-${Date.now()}`
      
      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: user.id },
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}` // Server-side filtering
          },
          (payload: any) => {
            console.log('🔔 Real-time notification received:', payload)
            const newNotification = payload.new as Notification
            
            console.log('✅ Processing notification for user:', user.id)
            
            // Add to notifications list at the top
            setNotifications(prev => {
              const exists = prev.find(n => n.id === newNotification.id)
              if (exists) {
                console.log('⚠️ Notification already exists, skipping duplicate')
                return prev
              }
              return [newNotification, ...prev]
            })
            
            // Update unread count if it's unread
            if (!newNotification.is_read) {
              setUnreadCount(prev => {
                const newCount = prev + 1
                console.log('📈 Real-time unread count updated:', prev, '->', newCount)
                return newCount
              })
            }
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/favicon.ico'
              })
              console.log('🔔 Browser notification shown')
            }
          }
        )
        .subscribe((status: string, err?: any) => {
          console.log('📡 Real-time subscription status:', status)
          setConnectionStatus(status)
          
          if (err) {
            console.error('❌ Subscription error:', err)
            isSubscribedRef.current = false
            return
          }
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time subscription active!')
            isSubscribedRef.current = true
            
            // Clear any existing polling
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
          } else if (status === 'CLOSED' || status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            console.warn(`⚠️ Real-time connection ${status}. Activating polling mode...`)
            isSubscribedRef.current = false
            
            // Start polling every 10 seconds as fallback
            if (!pollIntervalRef.current) {
              const interval = setInterval(() => {
                if (isAuthenticated && currentUserIdRef.current === user.id) {
                  console.log('🔄 Polling for new notifications...')
                  loadNotifications()
                }
              }, 10000)
              
              pollIntervalRef.current = interval
            }
          }
        })

      // Store channel reference
      channelRef.current = channel

    } catch (error) {
      console.error('❌ Error setting up realtime subscription:', error)
      isSubscribedRef.current = false
    }
  }

  // Manual refresh function
  const refreshNotifications = () => {
    if (!isAuthenticated) {
      console.log('🚪 User not authenticated, skipping refresh')
      return
    }
    console.log('🔄 Manual refresh triggered')
    loadNotifications(true)
  }

  // Main setup effect
  useEffect(() => {
    console.log('🚀 Initializing real-time notifications...')
    
    const initializeNotifications = async () => {
      // Check authentication first
      const user = await checkAuthentication()
      if (!user) {
        console.log('🚪 No user found, skipping notification setup')
        setIsLoading(false)
        return
      }

      // Check if user changed
      if (currentUserIdRef.current && currentUserIdRef.current !== user.id) {
        console.log('👤 User changed, cleaning up previous subscription')
        cleanup()
      }

      currentUserIdRef.current = user.id

      // Load initial notifications
      await loadNotifications()
      
      // Setup real-time subscription
      await setupRealtimeSubscription(user)

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('🔔 Notification permission:', permission)
        })
      }
    }

    initializeNotifications()

    // Cleanup function
    return () => {
      console.log('🏁 Component unmounting, cleaning up')
      cleanup()
    }
  }, []) // Only run on mount

  // Listen for authentication changes
  useEffect(() => {
    const interval = setInterval(async () => {
      const user = await checkAuthentication()
      
      // If user changed or logged out
      if ((!user && currentUserIdRef.current) || 
          (user && currentUserIdRef.current && user.id !== currentUserIdRef.current)) {
        console.log('👤 Authentication state changed, reinitializing')
        cleanup()
        
        if (user) {
          currentUserIdRef.current = user.id
          await loadNotifications()
          await setupRealtimeSubscription(user)
        } else {
          currentUserIdRef.current = null
          setNotifications([])
          setUnreadCount(0)
        }
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!isAuthenticated) {
      console.log('🚪 User not authenticated, cannot mark as read')
      return
    }

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
        console.log('✅ Marked notification as read:', notificationId)
      } else if (response.status === 401) {
        console.log('🚪 Authentication failed, user likely logged out')
        setIsAuthenticated(false)
        cleanup()
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error)
    }
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {/* Show connection status indicator */}
          <div 
            className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full ${
              connectionStatus === 'SUBSCRIBED' ? 'bg-green-500' : 
              connectionStatus === 'CONNECTING' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            title={`Real-time status: ${connectionStatus}`}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="end">
        <div className="p-3 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread • {connectionStatus === 'SUBSCRIBED' ? '🟢 Real-time' : '🔴 Polling (10s)'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshNotifications}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.filter(n => !n.is_read).length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No unread notifications
            </div>
          ) : (
            notifications.filter(n => !n.is_read).slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className="p-3 border-b cursor-pointer hover:bg-gray-50 bg-blue-50"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{notification.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="h-2 w-2 bg-blue-500 rounded-full ml-2 mt-1" />
                </div>
              </div>
            ))
          )}
        </div>
        
        {notifications.filter(n => !n.is_read).length > 0 && (
          <div className="p-3 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => {
                notifications.filter(n => !n.is_read).forEach(n => {
                  markAsRead(n.id)
                })
              }}
            >
              Mark all as read
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 