export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  link?: string | null
  read: boolean
  createdAt: string // This will be mapped from created_at
  userId: string // This will be mapped from user_id
}

export interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
}
