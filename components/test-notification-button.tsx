"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Bell, Loader2 } from "lucide-react"

export function TestNotificationButton() {
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const createTestNotifications = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/test/create-sample-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "✅ Test Notifications Created",
          description: result.message,
          duration: 3000
        })
      } else {
        toast({
          title: "❌ Error",
          description: result.error || 'Failed to create notifications',
          variant: "destructive",
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error creating test notifications:', error)
      toast({
        title: "❌ Error",
        description: 'Failed to create test notifications',
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Button
      onClick={createTestNotifications}
      disabled={isCreating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isCreating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {isCreating ? 'Creating...' : 'Test Notifications'}
    </Button>
  )
} 