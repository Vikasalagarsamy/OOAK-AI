"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

export function EmergencyMenuReset() {
  const [isResetting, setIsResetting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the menu system? This action cannot be undone.")) {
      return
    }

    setIsResetting(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/reset-menu-system", {
        method: "POST",
      })

      const data = await response.json()
      setResult({
        success: response.ok,
        message: data.message || (response.ok ? "Menu system reset successfully" : "Failed to reset menu system"),
      })
    } catch (error) {
      setResult({
        success: false,
        message: "An error occurred while resetting the menu system",
      })
      console.error("Error resetting menu system:", error)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div>
      {result && (
        <div
          className={`mb-4 p-3 rounded ${
            result.success
              ? "bg-green-100 border border-green-400 text-green-700"
              : "bg-red-100 border border-red-400 text-red-700"
          }`}
        >
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>{result.message}</span>
          </div>
        </div>
      )}

      <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
        {isResetting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
        Reset Menu System
      </Button>
    </div>
  )
}
