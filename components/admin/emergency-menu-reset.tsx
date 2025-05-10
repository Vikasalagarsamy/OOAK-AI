"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export function EmergencyMenuReset() {
  const [isResetting, setIsResetting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleReset = async () => {
    if (!confirm("This will reset the entire menu system and force a page reload. Continue?")) {
      return
    }

    setIsResetting(true)
    try {
      // Call the emergency reset endpoint
      const res = await fetch("/api/admin/reset-menu-system", {
        method: "POST",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: "Menu system reset",
          description: "Changes will take effect after page reload",
        })

        // Force reload from server
        setTimeout(() => {
          window.location.href = window.location.pathname + "?t=" + Date.now()
        }, 1000)
      } else {
        toast({
          title: "Reset failed",
          description: data.error || "Something went wrong",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Emergency reset error:", error)
      toast({
        title: "Reset failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
      {isResetting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Resetting...
        </>
      ) : (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Emergency Menu Reset
        </>
      )}
    </Button>
  )
}
