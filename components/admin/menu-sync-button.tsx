"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function MenuSyncButton() {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/admin/sync-menus", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Failed to synchronize menus: ${response.statusText}`)
      }

      const data = await response.json()

      toast({
        title: "Menu Synchronized",
        description: `Successfully synchronized menu structure. Added ${data.newItems} new items and updated ${data.parentUpdates} parent relationships.`,
      })
    } catch (error: any) {
      console.error("Error synchronizing menus:", error)
      toast({
        title: "Synchronization Failed",
        description: error.message || "An error occurred while synchronizing menus",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Button onClick={handleSync} disabled={syncing}>
      <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Synchronizing..." : "Synchronize Menu Structure"}
    </Button>
  )
}
