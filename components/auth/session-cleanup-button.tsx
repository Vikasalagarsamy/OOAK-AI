'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, RefreshCw, AlertCircle } from 'lucide-react'

/**
 * 🧹 SESSION CLEANUP UTILITY
 * 
 * Temporary component to help resolve cross-machine authentication issues
 * This component helps users clear stale session data
 */

export function SessionCleanupButton() {
  const [isClearing, setIsClearing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const clearSessionData = async () => {
    setIsClearing(true)
    setResult(null)

    try {
      // Step 1: Clear localStorage
      const localStorageItems = [
        'ultra_auth_user',
        'ultra_auth_token', 
        'ultra_auth_timestamp',
        'auth_user',
        'user_session',
        'selectedRole'
      ]

      let clearedItems = 0
      localStorageItems.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key)
          clearedItems++
        }
      })

      // Step 2: Clear sessionStorage
      sessionStorage.clear()

      // Step 3: Call server-side cleanup
      const response = await fetch('/api/auth/force-refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        setResult(`✅ Cleanup successful! Cleared ${clearedItems} localStorage items and server cookies. Please refresh the page and log in again.`)
      } else {
        setResult(`⚠️ Partial cleanup completed. Cleared ${clearedItems} localStorage items but server cleanup failed.`)
      }

      // Auto refresh page after 3 seconds
      setTimeout(() => {
        window.location.reload()
      }, 3000)

    } catch (error) {
      console.error('Cleanup error:', error)
      setResult('❌ Cleanup failed. Please manually clear browser data: Settings > Privacy > Clear browsing data')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <AlertCircle size={20} />
          Authentication Issues?
        </CardTitle>
        <CardDescription>
          Having trouble logging in? This tool will clear all cached authentication data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={clearSessionData}
          disabled={isClearing}
          className="w-full"
          variant="outline"
        >
          {isClearing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Clearing Session Data...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Session Data
            </>
          )}
        </Button>

        {result && (
          <div className="p-3 rounded-md bg-orange-50 border border-orange-200 text-sm">
            {result}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>This will:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Clear browser localStorage</li>
            <li>Clear browser sessionStorage</li>
            <li>Clear server-side cookies</li>
            <li>Refresh the page automatically</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 